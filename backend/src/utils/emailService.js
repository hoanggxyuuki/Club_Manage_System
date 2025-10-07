const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

(async () => {
    try {
        await transporter.verify();
        console.log('Kết nối SMTP đã được xác minh thành công');
    } catch (error) {
        console.error('Xác minh kết nối SMTP không thành công:', error);
        console.log('Cấu hình email:', {
            user: process.env.EMAIL_USER ? '(đã đặt)' : '(chưa đặt)',
            pass: process.env.EMAIL_APP_PASSWORD ? '(đã đặt)' : '(chưa đặt)'
        });
    }
})();

exports.sendPasswordResetEmail = async (email, resetToken) => {
    console.log('Đang cố gắng gửi email đặt lại mật khẩu');
    console.log('Email người dùng:', process.env.EMAIL_USER);
    console.log('URL Frontend:', process.env.FRONTEND_URL);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        throw new Error('Thiếu cấu hình email. Vui lòng kiểm tra EMAIL_USER và EMAIL_APP_PASSWORD trong tệp .env');
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Yêu cầu Đặt lại Mật khẩu',
        html: `
            <h1>Yêu cầu Đặt lại Mật khẩu</h1>
            <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu của bạn:</p>
            <a href="${resetUrl}">Đặt lại Mật khẩu</a>
            <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
            <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email đặt lại mật khẩu đã được gửi:', info.messageId);
        return info;
    } catch (error) {
        console.error('Lỗi gửi email:', error);
        throw new Error('Lỗi gửi email: ' + error.message);
    }
};

exports.sendRegistrationEmail = async (email, username, password) => {
    console.log(`Đang cố gắng gửi email xác nhận đăng ký đến: ${email}`); 

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.error('Lỗi Email Đăng ký: EMAIL_USER hoặc EMAIL_APP_PASSWORD chưa được đặt trong .env');
        throw new Error('Thiếu cấu hình email. Vui lòng kiểm tra EMAIL_USER và EMAIL_APP_PASSWORD trong tệp .env');
    }

    if (!process.env.FRONTEND_URL) { 
        console.error('Lỗi Email Đăng ký: FRONTEND_URL chưa được đặt trong .env. Không thể tạo liên kết đăng nhập.');
        throw new Error('Biến môi trường FRONTEND_URL chưa được đặt. Không thể tạo liên kết đăng nhập cho email đăng ký.');
    }

    const loginUrl = `${process.env.FRONTEND_URL}/login`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Đăng ký Tài khoản Thành công - Cần Hành động',
        html: `
            <h1>Chào mừng bạn đến với Hệ thống Quản lý Câu lạc bộ của chúng tôi!</h1>
            <p>Tài khoản của bạn đã được tạo thành công và đang chờ quản trị viên phê duyệt.</p>
            <p>Sau khi được phê duyệt, bạn có thể đăng nhập bằng thông tin sau:</p>
            <ul>
                <li><strong>Tên đăng nhập:</strong> ${email}</li>
                <li><strong>Mật khẩu:</strong> ${password}</li>
            </ul>
            <p>Bạn có thể đăng nhập tại: <a href="${loginUrl}">${loginUrl}</a></p>
            <p>Vui lòng giữ thông tin này an toàn. Chúng tôi khuyên bạn nên thay đổi mật khẩu sau lần đăng nhập đầu tiên.</p>
            <p>Bạn sẽ nhận được một email khác sau khi tài khoản của bạn được quản trị viên phê duyệt.</p>
            <p>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
        `
    };

    try {
        console.log(`Chuẩn bị gửi email đăng ký. Từ: ${process.env.EMAIL_USER}, Đến: ${email}, Chủ đề: "${mailOptions.subject}"`);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email xác nhận đăng ký đã được gửi thành công:', info.messageId);
        return info;
    } catch (error) {
        console.error('Lỗi trong quá trình transporter.sendMail để đăng ký:', error); 
        throw new Error('Lỗi gửi email đăng ký: ' + error.message);
    }
};