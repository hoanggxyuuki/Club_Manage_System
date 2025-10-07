const axios = require('axios');
const cron = require('node-cron');
const Event = require('./models/eventSchema');
const Task = require('./models/Task');
const ActivitySchedule = require('./models/ActivitySchedule');
const UploadTracking = require('./models/UploadTracking');
const ProxyUrl = require('./models/ProxyUrl');
const { createNotification } = require('./controllers/notificationController');


const EVENT_CHECK_INTERVAL = 100; 
const PROXY_FETCH_INTERVAL = 1; 
const PROXY_TEST_URL = 'https://google.com'; 


let systemAdminId = null;


const getSystemAdminId = async () => {
  if (systemAdminId) return systemAdminId;
  
  try {
    const User = require('./models/User');
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      systemAdminId = admin._id;
      return admin._id;
    }
    return null;
  } catch (err) {
    console.error('Error finding admin user:', err);
    return null;
  }
};


const testProxy = async (proxyUrl) => {
  try {
    const { HttpsProxyAgent } = require('https-proxy-agent');
    const proxyAgent = new HttpsProxyAgent(proxyUrl);
    
    const startTime = Date.now();
    await axios.get(PROXY_TEST_URL, {
      proxy: false,
      httpsAgent: proxyAgent,
      timeout: 5000 
    });
    const responseTime = Date.now() - startTime;
    
    return { success: true, responseTime };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Unknown error'
    };
  }
};


const fetchNewProxies = async () => {
  try {
    console.log('Fetching fresh proxies...');
    const response = await axios.get('https://raw.githubusercontent.com/databay-labs/free-proxy-list/refs/heads/master/http.txt', {
      timeout: 5000
    });
    
    if (!response.data) {
      console.error('No proxy data returned from source');
      return;
    }
    
    const adminId = await getSystemAdminId();
    if (!adminId) {
      console.error('No admin user found for proxy creation');
      return;
    }
    
    const proxies = response.data
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .slice(-100);  
    
    console.log(`Processing first ${proxies.length} potential proxies`);
    let newProxiesAdded = 0;
    
    for (const proxy of proxies) {
      const formattedProxy = proxy.startsWith('http://') ? proxy : `http://${proxy}`;
      
      const existingProxy = await ProxyUrl.findOne({ url: formattedProxy });
      if (existingProxy) continue;
      
      console.log(`Testing new proxy: ${formattedProxy}`);
      const testResult = await testProxy(formattedProxy);
      console.log(testResult)
      if (testResult.success) {
        
        const newProxy = new ProxyUrl({
          url: formattedProxy,
          detectionMethod: 'automated',
          confidence: 70,
          reason: 'Auto-fetched from GitHub proxy list',
          addedBy: adminId,
          lastChecked: new Date(),
          status: 'active',
          averageResponseTime: testResult.responseTime
        });
        
        await newProxy.save();
        newProxiesAdded++;
        console.log(`Added new working proxy: ${formattedProxy} (${testResult.responseTime}ms)`);
      }
    }
    
    console.log(`Added ${newProxiesAdded} new working proxies to the database`);
  } catch (error) {
    console.error('Error fetching new proxies:', error);
  }
};

const validateExistingProxies = async () => {
  try {
    console.log('Validating existing proxies...');
    
    
    const proxies = await ProxyUrl.find({
      $or: [
        { lastChecked: { $lt: new Date(Date.now() - 60 * 60 * 1000) } },
        { status: 'pending' }
      ]
    }).limit(20); 
    
    if (proxies.length === 0) {
      console.log('No proxies need validation at this time');
      return;
    }
    
    console.log(`Validating ${proxies.length} proxies...`);
    
    for (const proxy of proxies) {
      console.log(`Testing proxy: ${proxy.url}`);
      const testResult = await testProxy(proxy.url);
      
      
      if (testResult.success) {
        await ProxyUrl.findByIdAndUpdate(proxy._id, {
          $set: {
            status: 'active',
            lastChecked: new Date(),
            averageResponseTime: proxy.averageResponseTime 
              ? (proxy.averageResponseTime + testResult.responseTime) / 2 
              : testResult.responseTime
          },
          $inc: { successCount: 1 }
        });
        console.log(`Proxy ${proxy.url} is working (${testResult.responseTime}ms)`);
      } else {
        await ProxyUrl.findByIdAndUpdate(proxy._id, {
          $set: {
            lastChecked: new Date(),
            lastFailureReason: testResult.error,
            status: proxy.failureCount >= 4 ? 'inactive' : proxy.status
          },
          $inc: { failureCount: 1 }
        });
        console.log(`Proxy ${proxy.url} failed: ${testResult.error}`);
      }
    }
  } catch (error) {
    console.error('Error validating proxies:', error);
  }
};

let config = {
  method: 'get',
  maxBodyLength: Infinity,
  url: 'http://localhost:5000/api/bank/history/003072005',
};

const fetchData = async () => {
  try {
    const response = await axios.request(config);
  } catch (error) {
    console.log(error);
  }
};

const cleanupExpiredEvents = async () => {
  try {
    const now = new Date();
    
    const expiredEvents = await Event.find({
      endDate: {
        $lt: now,
        $gt: new Date(now.getTime() - EVENT_CHECK_INTERVAL * 1000)
      },
      status: { $ne: 'expired' }
    }).populate('creator participants.userId');

    
    const missedEvents = await Event.find({
      endDate: { $lt: now },
      status: { $ne: 'expired' }
    }).populate('creator participants.userId');

    const allExpiredEvents = [...expiredEvents, ...missedEvents];
    
    if (allExpiredEvents.length === 0) return; 

    
    await Promise.all(allExpiredEvents.map(async (event) => {
      try {
        
        const participantIds = event.participants
          .map(p => p.userId._id.toString())
          .filter(id => id !== event.creator._id.toString());

        
        if (participantIds.length > 0) {
          await createNotification({
            body: {
              title: 'Sự kiện vừa kết thúc',
              message: `Sự kiện "${event.name}" vừa kết thúc và đã được tự động lưu trữ.`,
              type: 'event',
              recipients: participantIds,
              sender: event.creator._id 
            },
            user: event.creator 
          });
        }
        

        
        await Event.findByIdAndUpdate(event._id, {
          status: 'expired',
          expiredAt: now
        });

        console.log(`Sự kiện "${event.name}" đã được đánh dấu là hết hạn vào lúc ${now.toLocaleString()}`);
      } catch (err) {
        console.error(`Lỗi xử lý sự kiện ${event._id}:`, err);
      }
    }));

    
    if (allExpiredEvents.length > 0) {
      console.log(`Đã xử lý ${allExpiredEvents.length} sự kiện hết hạn`);
    }
  } catch (error) {
    console.error('Lỗi khi dọn dẹp sự kiện đã hết hạn:', error);
  }
};

const sortTasks = async () => {
  try {
    const tasks = await Task.find({
      $or: [
        { progress: 100, status: { $nin: ['completed', 'awaiting_confirmation'] }, statusNotified: {$ne: true} },
        { dueDate: { $lt: new Date() }, status: { $nin: ['expired', 'completed'] }, statusNotified: {$ne: true} }
      ]
    }).populate('groupId').populate('assignedTo');

    for (const task of tasks) {
      if (!task.groupId) continue; 

      
      let newStatus = task.status;
      
      
      if (task.progress === 100 && !task.leaderConfirmation.confirmed && task.status !== 'awaiting_confirmation') {
        newStatus = 'awaiting_confirmation';
      } else if (task.dueDate && task.dueDate < new Date() && task.status !== 'completed') {
        newStatus = 'expired';
      }

      
      if (newStatus !== task.status) {
        await Task.findByIdAndUpdate(task._id, {
          $set: {
            status: newStatus,
            sortOrder: (newStatus === 'completed' || newStatus === 'expired') ? 1 : 0,
            lastStatusChange: new Date(),
            statusNotified: true 
          }
        });

        
        const assigneeIds = task.assignedTo.map(user => user._id.toString());
          
        if (assigneeIds.length > 0) {
          await createNotification({
            body: {
              title: 'Trạng thái công việc đã cập nhật',
              message: `Công việc "${task.title}" đã được đánh dấu là ${newStatus === 'completed' ? 'hoàn thành' : 'hết hạn'}.`,
              type: 'task',
              recipients: assigneeIds,
              groupId: task.groupId._id,
              sender: task.groupId.userId
            },
            user: { _id: task.groupId.userId }
          });
        }
      }
    }
  } catch (error) {
    console.error('Lỗi khi sắp xếp công việc:', error);
  }
};
const updateActivitySchedules = async () => {
  try {
    const now = new Date();
    
    // Find all schedules that need status updates
    const schedules = await ActivitySchedule.find({
      status: { $in: ['upcoming', 'ongoing'] }
    }).populate('groupId');

    // Process schedules in parallel
    await Promise.all(schedules.map(async (schedule) => {
      try {
        let newStatus = schedule.status;
        
        // Update status based on current time
        if (now > new Date(schedule.endTime)) {
          newStatus = 'completed';
          
          // If schedule is recurring, create next occurrence
          if (schedule.recurringType !== 'none') {
            
            // ================== SỬA LỖI Ở ĐÂY ==================
            // KIỂM TRA AN TOÀN: Chỉ tạo lịch lặp lại nếu groupId tồn tại.
            if (!schedule.groupId) {
              console.error(`Không thể tạo lịch lặp lại cho schedule._id: ${schedule._id} vì thiếu groupId hoặc group đã bị xóa.`);
              // Dừng xử lý cho lịch này và tiếp tục với các lịch khác
              return; 
            }
            // ======================================================

            const nextSchedule = new ActivitySchedule({
              groupId: schedule.groupId._id, // Lấy _id từ object group đã được populate
              title: schedule.title,
              description: schedule.description,
              location: schedule.location,
              recurringType: schedule.recurringType,
              createdBy: schedule.createdBy,
              maxParticipants: schedule.maxParticipants
            });

            // Calculate next start and end times based on recurring type
            const startTime = new Date(schedule.startTime);
            const endTime = new Date(schedule.endTime);
            const duration = endTime - startTime;

            switch (schedule.recurringType) {
              case 'daily':
                startTime.setDate(startTime.getDate() + 1);
                break;
              case 'weekly':
                startTime.setDate(startTime.getDate() + 7);
                break;
              case 'monthly':
                startTime.setMonth(startTime.getMonth() + 1);
                break;
            }
            
            endTime.setTime(startTime.getTime() + duration);
            
            nextSchedule.startTime = startTime;
            nextSchedule.endTime = endTime;

            await nextSchedule.save();
            console.log(`Đã tạo lịch lặp lại cho "${schedule.title}"`);

            // Notify group members about new schedule
            const memberIds = schedule.groupId.members.map(member => member.userId.toString());
            await createNotification({
              body: {
                title: 'Lịch sinh hoạt mới',
                message: `Lịch sinh hoạt lặp lại "${schedule.title}" đã được tạo`,
                type: 'schedule',
                groupId: schedule.groupId._id,
                sender: schedule.createdBy,
                recipients: memberIds
              },
              user: { _id: schedule.createdBy }
            });
          }
        } else if (now >= new Date(schedule.startTime) && now <= new Date(schedule.endTime)) {
          newStatus = 'ongoing';
        } else if (now < new Date(schedule.startTime)) {
          newStatus = 'upcoming';
        }

        // Only update if status has changed
        if (newStatus !== schedule.status) {
          await ActivitySchedule.findByIdAndUpdate(schedule._id, {
            status: newStatus
          });
          console.log(`Lịch hoạt động "${schedule.title}" đã được cập nhật thành ${newStatus}`);
        }
      } catch (err) {
        console.error(`Lỗi khi cập nhật lịch hoạt động ${schedule._id}:`, err);
      }
    }));
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái lịch hoạt động:', error);
  }
};      

const startCronJob = () => {
  cron.schedule('* * * * *', async () => {
    try {
      console.log('Đang xóa tất cả proxy với status inactive...');
      const result = await ProxyUrl.deleteMany({
        status: 'inactive'
      });
      console.log(`Đã xóa ${result.deletedCount} proxy inactive`);
    } catch (error) {
      console.error('Lỗi khi xóa proxy inactive:', error);
    }
  });
  cron.schedule(`*/${EVENT_CHECK_INTERVAL} * * * * *`, async () => {
    console.log('Kiểm tra sự kiện hết hạn...');
    await cleanupExpiredEvents();
  });

  cron.schedule('*/1 * * * *', async () => {
    console.log('Đang sắp xếp lại công việc...');
    await sortTasks();
  });

  cron.schedule('*/10 * * * * *', async () => {
    console.log('Đang cập nhật trạng thái lịch hoạt động...');
    await updateActivitySchedules();
  });

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  
  
  
  
  

  
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Đang dọn dẹp dữ liệu theo dõi tải lên...');
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      
      const result = await UploadTracking.deleteMany({
        'uploads.timestamp': { $lt: thirtyDaysAgo },
        blockedUntil: { $lt: now },
        botScore: 0
      });

      
      const records = await UploadTracking.find({});
      for (const record of records) {
        record.uploads = record.uploads.filter(upload =>
          upload.timestamp > thirtyDaysAgo
        );
        await record.save();
      }

      console.log(`Đã xóa ${result.deletedCount} bản ghi theo dõi tải lên cũ`);
    } catch (error) {
      console.error('Lỗi khi dọn dẹp dữ liệu theo dõi tải lên:', error);
    }
  });
};

module.exports = startCronJob;
