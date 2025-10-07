# Club Management System - Wireframe & System Architecture

## 🏗️ System Overview

Hệ thống quản lý câu lạc bộ (Club Management System) là một ứng dụng web full-stack được xây dựng với:
- **Frontend**: React.js + Vite + TailwindCSS + Ant Design
- **Backend**: Node.js + Express.js + MongoDB
- **Real-time**: Socket.IO cho chat và video call
- **Authentication**: JWT + OAuth (Google, Microsoft)
- **File Upload**: Multer với rate limiting

---

## 👥 User Roles & Access Levels

### 1. **Admin** 
- Quyền cao nhất, quản lý toàn bộ hệ thống
- Quản lý người dùng, cấu hình hệ thống
- Phê duyệt đăng ký, quản lý nội dung

### 2. **Member/Leader/Owner**
- Thành viên câu lạc bộ với các cấp độ khác nhau
- Tham gia hoạt động, sự kiện, diễn đàn

### 3. **Demo User**
- Tài khoản demo để xem trước tính năng
- Quyền hạn hạn chế

---

## 🎨 Frontend Architecture

### Main Layout Structure
```
┌─────────────────────────────────────────────────────┐
│                   NAVBAR                            │
│  [Logo] [User Menu] [Notifications] [Search]        │
├─────────────┬───────────────────────────────────────┤
│   SIDEBAR   │           MAIN CONTENT                │
│             │                                       │
│ - Dashboard │  ┌─────────────────────────────────┐  │
│ - Profile   │  │                                 │  │
│ - Groups    │  │        Dynamic Content          │  │
│ - Events    │  │        Based on Route           │  │
│ - Tasks     │  │                                 │  │
│ - Forum     │  │                                 │  │
│ - Chat      │  │                                 │  │
│ - Friends   │  │                                 │  │
│ - Bank      │  └─────────────────────────────────┘  │
│ - Evidence  │                                       │
│ - Anonymous │                                       │
│ - Match     │                                       │
│             │                                       │
└─────────────┴───────────────────────────────────────┘
```

---

## 📱 Page Wireframes

### 1. **Login/Register Page**
```
┌─────────────────────────────────────────────────────┐
│                 CLUB LOGO                           │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │              LOGIN FORM                     │    │
│  │  Email: [___________________]               │    │
│  │  Password: [___________________]            │    │
│  │  [Login Button]                             │    │
│  │                                             │    │
│  │  [Google Login] [Microsoft Login]           │    │
│  │                                             │    │
│  │  [Register] [Forgot Password]               │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│           [Animated Background/Graphics]            │
└─────────────────────────────────────────────────────┘
```

### 2. **Dashboard (Member)**
```
┌─────────────────────────────────────────────────────┐
│  Welcome Banner with Greeting & User Info           │
├──────────────┬──────────────────┬───────────────────┤
│ PROFILE CARD │   MAIN FEED      │  SIDEBAR WIDGETS  │
│              │                  │                   │
│ [Avatar]     │ ┌──────────────┐ │ ┌───────────────┐ │
│ Name         │ │ Create Post  │ │ │   BIRTHDAYS   │ │
│ Role         │ │ [Text Area]  │ │ │ Today: 2 users│ │
│ Stats        │ │ [📷][📎][😊] │ │ └───────────────┘ │
│              │ └──────────────┘ │                   │
│ QUICK LINKS  │                  │ ┌───────────────┐ │
│ - Events     │ ┌──────────────┐ │ │ UPCOMING      │ │
│ - Tasks      │ │  FORUM POST  │ │ │ EVENTS        │ │
│ - Groups     │ │  [Content]   │ │ │ • Meeting     │ │
│              │ │  👍 💬 📤   │ │ │ • Workshop    │ │
│ TOP          │ └──────────────┘ │ └───────────────┘ │
│ PERFORMERS   │                  │                   │
│ 1. User A    │ ┌──────────────┐ │ ┌───────────────┐ │
│ 2. User B    │ │  FORUM POST  │ │ │ NOTIFICATIONS │ │
│ 3. User C    │ │  [Content]   │ │ │ • New Event   │ │
│              │ │  👍 💬 📤   │ │ │ • Task Due    │ │
│              │ └──────────────┘ │ └───────────────┘ │
└──────────────┴──────────────────┴───────────────────┘
```

### 3. **Groups Page**
```
┌─────────────────────────────────────────────────────┐
│  Groups Management                                  │
│  [+ Create Group] [Search: ____________] [Filter]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │  GROUP A   │ │  GROUP B   │ │  GROUP C   │      │
│  │ [Icon/Img] │ │ [Icon/Img] │ │ [Icon/Img] │      │
│  │ 15 members │ │ 8 members  │ │ 22 members │      │
│  │ 3 tasks    │ │ 1 task     │ │ 7 tasks    │      │
│  │ [View][⚙️] │ │ [View][⚙️] │ │ [View][⚙️] │      │
│  └────────────┘ └────────────┘ └────────────┘      │
│                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │  GROUP D   │ │  GROUP E   │ │  + NEW     │      │
│  │ [Icon/Img] │ │ [Icon/Img] │ │   GROUP    │      │
│  │ 12 members │ │ 5 members  │ │            │      │
│  │ 2 tasks    │ │ 0 tasks    │ │            │      │
│  │ [View][⚙️] │ │ [View][⚙️] │ │            │      │
│  └────────────┘ └────────────┘ └────────────┘      │
└─────────────────────────────────────────────────────┘
```

### 4. **Events Page**
```
┌─────────────────────────────────────────────────────┐
│  Events & Activities                                │
│  [+ Create Event] [Filter] [Calendar View] [List]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  UPCOMING EVENT                             │    │
│  │  📅 Workshop: React Fundamentals            │    │
│  │  📍 Room 101  ⏰ Dec 15, 2024 - 2:00 PM    │    │
│  │  👥 25/30 participants                      │    │
│  │  [Join Event] [QR Code] [Details]           │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  EVENT                                      │    │
│  │  📅 Club Meeting: Monthly Review            │    │
│  │  📍 Main Hall  ⏰ Dec 20, 2024 - 7:00 PM   │    │
│  │  👥 45/50 participants                      │    │
│  │  [Join Event] [QR Code] [Details]           │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  PAST EVENT                                 │    │
│  │  📅 Hackathon 2024                          │    │
│  │  📍 Computer Lab  ⏰ Dec 1-3, 2024          │    │
│  │  👥 38 participants                         │    │
│  │  [View Results] [Gallery] [Feedback]        │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 5. **Tasks/Workflow Page**
```
┌─────────────────────────────────────────────────────┐
│  Task Management & Workflows                        │
│  [+ Create Task] [My Tasks] [Group Tasks] [All]     │
├───────────────┬─────────────────┬───────────────────┤
│   TO DO       │   IN PROGRESS   │    COMPLETED      │
│               │                 │                   │
│ ┌───────────┐ │ ┌─────────────┐ │ ┌───────────────┐ │
│ │ Task #1   │ │ │ Task #3     │ │ │ Task #5       │ │
│ │ Priority:H│ │ │ Progress:75%│ │ │ ✅ Done       │ │
│ │ Due:Dec15 │ │ │ Assigned:Me │ │ │ Completed:✓   │ │
│ │ [Edit][⚠️]│ │ │ [Update]    │ │ │ [View]        │ │
│ └───────────┘ │ └─────────────┘ │ └───────────────┘ │
│               │                 │                   │
│ ┌───────────┐ │ ┌─────────────┐ │ ┌───────────────┐ │
│ │ Task #2   │ │ │ Task #4     │ │ │ Task #6       │ │
│ │ Priority:M│ │ │ Progress:30%│ │ │ ✅ Done       │ │
│ │ Due:Dec20 │ │ │ Assigned:   │ │ │ Completed:✓   │ │
│ │ [Edit][⚠️]│ │ │ Team Alpha  │ │ │ [View]        │ │
│ └───────────┘ │ └─────────────┘ │ └───────────────┘ │
│               │                 │                   │
│ [+ Add Task]  │ [+ Add Task]    │ [View History]    │
└───────────────┴─────────────────┴───────────────────┘
```

### 6. **Forum Page**
```
┌─────────────────────────────────────────────────────┐
│  Community Forum                                    │
│  [+ New Post] [Search] [Categories ▼] [Filter]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📌 PINNED POST                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ [👤] Admin - Club Rules & Guidelines        │    │
│  │ Please read these important guidelines...   │    │
│  │ 👍 25  💬 8  📤 Share  ⏰ 2 days ago       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ [👤] John Doe - Need help with React        │    │
│  │ I'm having trouble with state management... │    │
│  │ 🏷️ #react #help #javascript                │    │
│  │ 👍 12  💬 15  📤 Share  ⏰ 3 hours ago      │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ [👤] Jane Smith - Project Showcase          │    │
│  │ Check out my latest web app project!       │    │
│  │ [🖼️ Image attachment]                       │    │
│  │ 🏷️ #showcase #webdev #project              │    │
│  │ 👍 8   💬 5   📤 Share  ⏰ 1 day ago        │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [Load More Posts] [Page 1 2 3 ... 10]             │
└─────────────────────────────────────────────────────┘
```

### 7. **Chat/Video Call Page**
```
┌─────────────────────────────────────────────────────┐
│                   CHAT INTERFACE                    │
├─────────────┬───────────────────────────────────────┤
│ USERS LIST  │           CHAT WINDOW                 │
│             │                                       │
│ 🟢 John Doe │  ┌─────────────────────────────────┐  │
│ 🔴 Jane S.  │  │ Chat with John Doe              │  │
│ 🟡 Mike R.  │  │ [📹 Video] [📞 Voice] [📎]      │  │
│ 🟢 Sarah L. │  ├─────────────────────────────────┤  │
│ 🔴 Tom B.   │  │ John: Hey, how's the project?   │  │
│             │  │ ⏰ 10:30 AM                     │  │
│ [Search]    │  │                                 │  │
│             │  │ Me: Going well! Almost done     │  │
│ RECENT      │  │ ⏰ 10:32 AM                     │  │
│ • Group A   │  │                                 │  │
│ • Project   │  │ John: Great! Can we review it?  │  │
│ • Team Chat │  │ ⏰ 10:35 AM                     │  │
│             │  │                                 │  │
│ GROUPS      │  │ [Video Call Incoming...]        │  │
│ • Dev Team  │  │ [Accept] [Decline]              │  │
│ • Design    │  └─────────────────────────────────┘  │
│ • Marketing │  │                                 │  │
│             │  │ [Type a message...] [Send] [😊] │  │
└─────────────┴───────────────────────────────────────┘
```

### 8. **Friends/Social Page**
```
┌─────────────────────────────────────────────────────┐
│  Friends & Social Network                           │
│  [Friends] [Requests] [Find People] [Members]       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  MY FRIENDS (24)                                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ [👤] John  │ │ [👤] Jane  │ │ [👤] Mike  │      │
│  │ Software   │ │ Designer   │ │ Manager    │      │
│  │ Developer  │ │ [💬][📞]   │ │ [💬][📞]   │      │
│  │ [💬][📞]   │ └────────────┘ └────────────┘      │
│  └────────────┘                                    │
│                                                     │
│  FRIEND REQUESTS (3)                                │
│  ┌─────────────────────────────────────────────┐    │
│  │ [👤] Sarah Johnson wants to be friends      │    │
│  │ Mutual friends: John, Mike                 │    │
│  │ [Accept] [Decline]                         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  SUGGESTED FRIENDS                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ [👤] Tom   │ │ [👤] Lisa  │ │ [👤] Alex  │      │
│  │ 2 mutual   │ │ 1 mutual   │ │ 3 mutual   │      │
│  │ friends    │ │ friend     │ │ friends    │      │
│  │ [Add Friend│ │ [Add Friend│ │ [Add Friend│      │
│  └────────────┘ └────────────┘ └────────────┘      │
└─────────────────────────────────────────────────────┘
```

### 9. **Bank/Finance Page**
```
┌─────────────────────────────────────────────────────┐
│  Financial Management                               │
│  [View Transactions] [Member Payments] [Export]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ACCOUNT OVERVIEW                                   │
│  ┌─────────────────────────────────────────────┐    │
│  │ Account: ******1234                         │    │
│  │ Current Balance: 2,450,000 VND              │    │
│  │ Last Updated: Dec 12, 2024 10:30 AM        │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  RECENT TRANSACTIONS                                │
│  ┌─────────────────────────────────────────────┐    │
│  │ Date       | Description    | Amount  | Type│    │
│  │ 12/12/2024 | Membership Fee | +50,000 | IN  │    │
│  │ 11/12/2024 | Event Payment  | +25,000 | IN  │    │
│  │ 10/12/2024 | Supply Purchase| -15,000 | OUT │    │
│  │ 09/12/2024 | Monthly Dues   | +30,000 | IN  │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  MEMBER PAYMENTS STATUS                             │
│  ┌─────────────────────────────────────────────┐    │
│  │ ✅ John Doe - Paid (50,000 VND)             │    │
│  │ ✅ Jane Smith - Paid (50,000 VND)           │    │
│  │ ⏳ Mike Ross - Pending (50,000 VND)         │    │
│  │ ❌ Sarah Connor - Overdue (50,000 VND)      │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 10. **Evidence/Portfolio Page**
```
┌─────────────────────────────────────────────────────┐
│  Evidence & Achievement Portfolio                   │
│  [+ Submit Evidence] [My Evidence] [All] [Filter]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 📄 PROJECT DOCUMENTATION                    │    │
│  │ Submitted by: John Doe                      │    │
│  │ Type: Project Completion                    │    │
│  │ Status: ✅ Approved                         │    │
│  │ Date: Dec 10, 2024                         │    │
│  │ Description: React e-commerce application  │    │
│  │ Files: [📎 report.pdf] [📎 screenshots]    │    │
│  │ [View Details] [Download] [Edit]            │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🏆 HACKATHON PARTICIPATION                  │    │
│  │ Submitted by: Jane Smith                    │    │
│  │ Type: Competition                           │    │
│  │ Status: ⏳ Under Review                     │    │
│  │ Date: Dec 8, 2024                          │    │
│  │ Description: Won 2nd place in hackathon    │    │
│  │ Files: [📎 certificate.pdf] [📎 code.zip]  │    │
│  │ [View Details] [Download] [Edit]            │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 📚 WORKSHOP ATTENDANCE                      │    │
│  │ Submitted by: Mike Ross                     │    │
│  │ Type: Learning Achievement                  │    │
│  │ Status: ❌ Rejected                         │    │
│  │ Date: Dec 5, 2024                          │    │
│  │ Description: Attended React workshop       │    │
│  │ Reason: Insufficient documentation         │    │
│  │ [View Details] [Resubmit] [Appeal]         │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---


---

## 🗄️ Database Schema Overview

### Core Collections/Models
```
Users
├── _id, username, email, password
├── fullName, phone, dateOfBirth, gender
├── role, secondaryRole, bio, interests
├── avatar, city, province, cv
├── relationshipStatus, profileVisibility
├── lastActive, createdAt, approved
└── googleId, microsoftId

Groups
├── _id, name, description, type
├── creator, members[{user, role, joinedAt}]
├── maxMembers, isPrivate
├── createdAt, updatedAt
└── activitySchedules

Events
├── _id, name, description, status
├── startDate, endDate, creator, eventType
├── managingUnit, supervisors, location
├── participants[{userId, status, attendance}]
├── qrCode{code, raw, value, expiresAt}
└── timestamps

Tasks
├── _id, title, description, type
├── assignedTo, assignedBy, priority
├── status, progress, dueDate
├── group, parentTask, subtasks
├── attachments, comments
└── workflow, createdAt, updatedAt

Forum Posts
├── _id, title, description, category
├── tags, author, isAnonymous
├── attachments[{url, type}]
├── likes[{user, createdAt}]
├── comments[{content, author, replies}]
├── polls[{question, options, expiresAt}]
├── status, views, isPinned
└── createdAt, updatedAt

Chat
├── _id, participants[]
├── messages[{sender, content, timestamp, reactions}]
├── lastMessage, messageCount
└── isDeleted, deletedAt

Friends
├── _id, user, friend
├── status (pending/accepted/rejected)
└── createdAt

Bank Transactions
├── _id, refNo, postingDate
├── transactionDate, accountNo
├── creditAmount, debitAmount
├── description, processedForMember
└── memberUsername, memberId

Evidence
├── _id, submittedBy, type
├── title, description, files
├── status, reviewedBy, reviewDate
├── reviewComments, points
└── submissionDate

System Config
├── _id, settingName, settingValue
├── dataType, description
├── lastUpdatedBy, isPublic
└── createdAt, updatedAt
```

---

## 🚀 Key Features & Functionalities

### 1. **Authentication & Authorization**
- JWT-based authentication
- OAuth integration (Google, Microsoft)
- Role-based access control
- Password reset functionality

### 2. **Real-time Communication**
- Socket.IO for instant messaging
- Video/Voice calling integration
- Real-time notifications
- Online status tracking

### 3. **File Management**
- Secure file uploads with rate limiting
- Multiple file types support
- Image/video processing
- Anti-virus scanning

### 4. **Advanced Search & Filtering**
- Full-text search across content
- Vietnamese text normalization
- Category/tag filtering
- User search with friend status

### 5. **Event Management**
- QR code generation for attendance
- Real-time participant tracking
- Calendar integration
- Event notifications

### 6. **Task & Workflow System**
- Drag-and-drop task boards
- Progress tracking
- Group collaboration
- Deadline management

### 7. **Banking Integration**
- Transaction monitoring
- Member payment tracking
- Financial reporting
- Automated payment processing

### 8. **Content Moderation**
- URL preview with blacklist
- Anonymous messaging system
- IP blocking for security
- Content filtering

### 9. **Performance Tracking**
- Member performance analytics
- Achievement system
- Competition management
- Statistics dashboard

### 10. **System Administration**
- Dynamic configuration management
- User approval workflow
- System health monitoring
- Audit logging

---

## 🎯 Technology Stack Summary

### Frontend Technologies
- **React 18** - Core UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Ant Design** - Component library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **Framer Motion** - Animations
- **React Beautiful DnD** - Drag and drop

### Backend Technologies
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time engine
- **JWT** - Authentication
- **Multer** - File uploads
- **Passport.js** - OAuth
- **CronJob** - Scheduled tasks
- **Nodemailer** - Email service

### Development & Deployment
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Bun** - Package manager (frontend)
- **npm** - Package manager (backend)
- **Git** - Version control

---

## 📈 Future Enhancements

1. **Mobile Application** - React Native implementation
2. **Advanced Analytics** - Data visualization dashboard
3. **AI Integration** - Smart content recommendations
4. **Progressive Web App** - Offline functionality
5. **Multi-language Support** - Internationalization
6. **Advanced Reporting** - Export capabilities
7. **Integration APIs** - Third-party service connections
8. **Enhanced Security** - Two-factor authentication

---

*Wireframe được tạo ngày: December 12, 2024*
*Phiên bản: 1.0*
