const ClubNews = require('../models/ClubNews');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');


exports.getAllClubNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const news = await ClubNews.find()
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean();

    const total = await ClubNews.countDocuments();

    return res.status(200).json({
      success: true,
      data: news,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error retrieving club news:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách tin tức'
    });
  }
};


exports.getClubNewsById = async (req, res) => {
  try {
    const news = await ClubNews.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin tức'
      });
    }

    return res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error retrieving club news:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy tin tức'
    });
  }
};


exports.createClubNews = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { title, content, summary, showToAllPending, showToMembers, publishDate, isPublished, isActive } = req.body;
    
    
    let imagePath = '';
    if (req.file) {
      imagePath = req.file.path.replace(/\\/g, '/'); 
      imagePath = imagePath.replace('backend/', ''); 
    }

    const newNews = new ClubNews({
      title,
      content,
      summary: summary || content.substring(0, 150) + (content.length > 150 ? '...' : ''),
      image: imagePath,
      showToAllPending: showToAllPending || false,
      showToMembers: showToMembers || true,
      createdBy: req.user.id,
      publishDate: publishDate || Date.now(),
      isPublished: isPublished !== undefined ? isPublished : true,
      isActive: isActive !== undefined ? isActive : true
    });

    await newNews.save();

    return res.status(201).json({
      success: true,
      message: 'Tin tức đã được tạo thành công',
      data: newNews
    });
  } catch (error) {
    console.error('Error creating club news:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo tin tức'
    });
  }
};


exports.updateClubNews = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { title, content, summary, showToAllPending, showToMembers, publishDate, isPublished, isActive } = req.body;

    
    const newsExists = await ClubNews.findById(req.params.id);
    if (!newsExists) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin tức'
      });
    }

    
    const updateData = { updatedAt: Date.now() };
    
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (summary) updateData.summary = summary;
    else if (content) updateData.summary = content.substring(0, 150) + (content.length > 150 ? '...' : '');
    
    if (showToAllPending !== undefined) updateData.showToAllPending = showToAllPending;
    if (showToMembers !== undefined) updateData.showToMembers = showToMembers;
    if (publishDate) updateData.publishDate = publishDate;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (isActive !== undefined) updateData.isActive = isActive;

    
    if (req.file) {
      
      if (newsExists.image && fs.existsSync(newsExists.image)) {
        fs.unlinkSync(newsExists.image);
      }
      
      const imagePath = req.file.path.replace(/\\/g, '/');
      updateData.image = imagePath.replace('backend/', '');
    }

    
    const updatedNews = await ClubNews.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: false 
      }
    ).populate('createdBy', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Tin tức đã được cập nhật thành công',
      data: updatedNews
    });
  } catch (error) {
    console.error('Error updating club news:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật tin tức'
    });
  }
};


exports.deleteClubNews = async (req, res) => {
  try {
    const news = await ClubNews.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin tức'
      });
    }

    
    if (news.image && fs.existsSync(news.image)) {
      fs.unlinkSync(news.image);
    }

    await ClubNews.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Tin tức đã được xóa thành công'
    });
  } catch (error) {
    console.error('Error deleting club news:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa tin tức'
    });
  }
};


exports.getClubNewsForPendingUser = async (req, res) => {
  try {
    const news = await ClubNews.find({
      showToAllPending: true,
      isPublished: true,
      publishDate: { $lte: new Date() }
    })
    .sort({ publishDate: -1 })
    .lean();

    return res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error retrieving club news for pending user:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách tin tức'
    });
  }
};


exports.getClubNewsForMember = async (req, res) => {
  try {
    const news = await ClubNews.find({
      showToMembers: true,
      isPublished: true,
      publishDate: { $lte: new Date() }
    })
    .sort({ publishDate: -1 })
    .lean();

    return res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error retrieving club news for member:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách tin tức'
    });
  }
};


exports.getActiveClubNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const news = await ClubNews.find({ isActive: true })
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ClubNews.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      data: news,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting active club news:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi lấy tin tức câu lạc bộ đang hoạt động' });
  }
};