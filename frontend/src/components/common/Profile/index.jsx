import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Camera,
  MapPin,
  Save,
  X,
  Calendar,
  User,
  Phone,
  AtSign,
  Heart,
  FileText,
  Tag,
  Lock,
} from "lucide-react";




import { useNotification } from "../../../context/NotificationContext";
import PropTypes from "prop-types";
import Modal from "./Modal";


const defaultAvatar = "/public/vite.svg";


const randomOffsets = Array.from({ length: 20 }, () =>
  [`-0.5deg`, `0.3deg`, `0deg`, `0.2deg`][Math.floor(Math.random() * 4)]
);


const dateInputStyle = {
  colorScheme: 'light',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};


const FormField = React.memo(
  ({ icon: Icon, label, required, children, error, offsetIndex = 0 }) => (
    <div
      className="mb-5 relative bg-white rounded-lg"
      style={{ transform: `rotate(${randomOffsets[offsetIndex % randomOffsets.length]})` }}
    >
      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
        {Icon && <Icon size={16} className="mr-1.5 text-blue-500" />}
        <span>{label}</span>
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <X size={14} className="mr-1" />
          {error}
        </p>
      )}
    </div>
  )
);


const TabItem = React.memo(({ active, icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center px-4 py-3 rounded-t-lg transition-all border-b-2 ${
      active
        ? "text-blue-600 border-blue-600 bg-blue-50/50"
        : "text-gray-600 border-transparent hover:bg-gray-50"
    }`}
    style={{
      transform: active ? "translateY(-2px)" : "none",
    }}
  >
    <Icon
      size={18}
      className={`mr-1.5 ${active ? "text-blue-600" : "text-gray-500"}`}
    />

    <span className="font-medium">{label}</span>
  </button>
));

const ProfileModal = ({ isOpen, onClose, onSubmit, user }) => {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState("profile");
  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || defaultAvatar);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    avatar: user?.avatar || defaultAvatar,
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
    gender: user?.gender || "",
    bio: user?.bio || "",
    interests: user?.interests || [],
    city: user?.city || "",
    province: user?.province || "",
    relationshipStatus: user?.relationshipStatus || "prefer-not-to-say",
  });

  
  const genderOptions = useMemo(() => [
    { value: "male", label: "Nam" },
    { value: "female", label: "Nữ" },
    { value: "other", label: "Khác" },
  ], []);

  const relationshipOptions = useMemo(() => [
    { value: "single", label: "Độc thân" },
    { value: "in-relationship", label: "Đang hẹn hò" },
    { value: "married", label: "Đã kết hôn" },
    { value: "complicated", label: "Phức tạp" },
    { value: "prefer-not-to-say", label: "Không muốn tiết lộ" },
  ], []);

  useEffect(() => {
    if (user) {
      setFormData((prevData) => ({
        ...prevData,
        fullName: user.fullName || "",
        phone: user.phone || "",
        avatar: user.avatar || defaultAvatar,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
        gender: user.gender || "",
        bio: user.bio || "",
        interests: user.interests || [],
        city: user.city || "",
        province: user.province || "",
        relationshipStatus: user.relationshipStatus || "prefer-not-to-say",
      }));
      
      
      if (user.avatar && !user.avatar.startsWith('blob:')) {
        setAvatarPreview(`${import.meta.env.VITE_PROXY_API_URL}${user.avatar}`);
      } else {
        setAvatarPreview(user.avatar || defaultAvatar);
      }
    }
  }, [user]);

  
  const getValidationError = useCallback((field, value) => {
    switch (field) {
      case 'fullName':
        if (!value || typeof value !== 'string') {
          return 'Họ tên không được để trống';
        }
        if (value.length < 2) {
          return 'Họ tên phải có ít nhất 2 ký tự';
        }
        if (value.length > 50) {
          return 'Họ tên không được vượt quá 50 ký tự';
        }
        if (value.trim() !== value) {
          return 'Họ tên không được có khoảng trắng ở đầu/cuối';
        }
        if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value)) {
          return 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
        }
        if (value.trim().split(/\s+/).length < 2) {
          return 'Vui lòng nhập đầy đủ họ và tên';
        }
        return null;

      case 'phone':
        if (!value) {
          return 'Số điện thoại không được để trống';
        }
        
        const cleanPhone = value.replace(/[\s\-\(\)\+]/g, '');
        
        if (!/^[0-9]+$/.test(cleanPhone)) {
          return 'Số điện thoại chỉ được chứa chữ số';
        }
        
        
        const vietnamesePatterns = [
          /^(84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-9])[0-9]{7}$/,
          /^(84|0)(2[0-9])[0-9]{8}$/
        ];
        
        const isValidVietnamese = vietnamesePatterns.some(pattern => pattern.test(cleanPhone));
        
        if (!isValidVietnamese) {
          if (cleanPhone.length < 10) {
            return 'Số điện thoại quá ngắn (ít nhất 10 số)';
          } else if (cleanPhone.length > 11) {
            return 'Số điện thoại quá dài (tối đa 11 số)';
          } else {
            return 'Số điện thoại không đúng định dạng Việt Nam';
          }
        }
        return null;

      case 'bio':
        if (value && value.length > 500) {
          return 'Tiểu sử không được vượt quá 500 ký tự';
        }
        if (value && value.trim() !== value) {
          return 'Tiểu sử không được có khoảng trắng ở đầu/cuối';
        }
        return null;

      case 'city':
      case 'province':
        if (value && (value.length < 2 || value.length > 50)) {
          const fieldName = field === 'city' ? 'Thành phố' : 'Tỉnh/Thành phố';
          return `${fieldName} phải có từ 2-50 ký tự`;
        }
        if (value && !/^[a-zA-ZÀ-ỹ\s\-\.]+$/.test(value)) {
          const fieldName = field === 'city' ? 'Thành phố' : 'Tỉnh/Thành phố';
          return `${fieldName} chỉ được chứa chữ cái, khoảng trắng, dấu gạch ngang và dấu chấm`;
        }
        return null;

      case 'dateOfBirth':
        if (!value || !(value instanceof Date) || isNaN(value)) {
          return 'Vui lòng chọn ngày sinh hợp lệ';
        }
        
        const today = new Date();
        const age = today.getFullYear() - value.getFullYear();
        const monthDiff = today.getMonth() - value.getMonth();
        const dayDiff = today.getDate() - value.getDate();
        
        
        let exactAge = age;
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          exactAge--;
        }
        
        if (exactAge < 13) {
          return 'Bạn phải từ 13 tuổi trở lên';
        }
        if (exactAge > 100) {
          return 'Tuổi không hợp lệ';
        }
        if (value > today) {
          return 'Ngày sinh không thể ở tương lai';
        }
        return null;

      case 'currentPassword':
        if (!value) {
          return 'Vui lòng nhập mật khẩu hiện tại';
        }
        if (value.length < 6) {
          return 'Mật khẩu hiện tại quá ngắn';
        }
        return null;

      case 'newPassword':
        if (!value) {
          return 'Vui lòng nhập mật khẩu mới';
        }
        if (value.length < 8) {
          return 'Mật khẩu mới phải có ít nhất 8 ký tự';
        }
        if (!/[A-Z]/.test(value)) {
          return 'Mật khẩu mới phải có ít nhất 1 chữ cái viết hoa';
        }
        if (!/[a-z]/.test(value)) {
          return 'Mật khẩu mới phải có ít nhất 1 chữ cái viết thường';
        }
        if (!/[0-9]/.test(value)) {
          return 'Mật khẩu mới phải có ít nhất 1 chữ số';
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
          return 'Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt';
        }
        if (value === formData.currentPassword) {
          return 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }
        return null;

      case 'confirmPassword':
        if (!value) {
          return 'Vui lòng xác nhận mật khẩu mới';
        }
        if (value !== formData.newPassword) {
          return 'Xác nhận mật khẩu không khớp với mật khẩu mới';
        }
        return null;

      default:
        return null;
    }
  }, [formData.currentPassword, formData.newPassword]);

  // Validation functions
  const validateField = useCallback((field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'fullName':
        if (!value || value.trim().length === 0) {
          newErrors.fullName = 'Vui lòng nhập họ tên';
        } else if (value.trim().length < 2) {
          newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
        } else if (value.trim().length > 50) {
          newErrors.fullName = 'Họ tên không được quá 50 ký tự';
        } else if (/^\s+|\s+$/.test(value)) {
          newErrors.fullName = 'Họ tên không được bắt đầu hoặc kết thúc bằng khoảng trắng';
        } else if (/\s{2,}/.test(value)) {
          newErrors.fullName = 'Họ tên không được chứa nhiều khoảng trắng liên tiếp';
        } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value.trim())) {
          newErrors.fullName = 'Họ tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng';
        } else if (/^\w+$/.test(value.trim())) {
          newErrors.fullName = 'Vui lòng nhập họ và tên đầy đủ (ít nhất 2 từ)';
        } else {
          delete newErrors.fullName;
        }
        break;
        
      case 'phone':
        if (!value || value.trim().length === 0) {
          newErrors.phone = 'Vui lòng nhập số điện thoại';
        } else {
          const cleanPhone = value.replace(/\s+/g, '');
          const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
          
          if (cleanPhone.length < 10) {
            newErrors.phone = 'Số điện thoại phải có ít nhất 10 chữ số';
          } else if (cleanPhone.length > 12) {
            newErrors.phone = 'Số điện thoại không được quá 12 chữ số';
          } else if (!/^[0-9+\s-]+$/.test(value)) {
            newErrors.phone = 'Số điện thoại chỉ được chứa số, dấu + và khoảng trắng';
          } else if (!phoneRegex.test(cleanPhone)) {
            if (cleanPhone.startsWith('0')) {
              newErrors.phone = 'Số điện thoại phải bắt đầu bằng 03, 05, 07, 08 hoặc 09 (VD: 0912345678)';
            } else if (cleanPhone.startsWith('+84')) {
              newErrors.phone = 'Số điện thoại quốc tế không đúng định dạng (VD: +84912345678)';
            } else {
              newErrors.phone = 'Số điện thoại không đúng định dạng Việt Nam (VD: 0912345678)';
            }
          } else {
            delete newErrors.phone;
          }
        }
        break;
        
      case 'bio':
        if (value && value.trim().length > 500) {
          newErrors.bio = 'Tiểu sử không được quá 500 ký tự';
        } else if (value && value.trim().length < 10 && value.trim().length > 0) {
          newErrors.bio = 'Tiểu sử phải có ít nhất 10 ký tự nếu bạn muốn điền';
        } else if (value && /^\s+|\s+$/.test(value)) {
          newErrors.bio = 'Tiểu sử không được bắt đầu hoặc kết thúc bằng khoảng trắng';
        } else {
          delete newErrors.bio;
        }
        break;
        
      case 'city':
        if (value && value.trim().length > 0) {
          if (value.length < 2) {
            newErrors.city = 'Tên thành phố phải có ít nhất 2 ký tự';
          } else if (value.length > 50) {
            newErrors.city = 'Tên thành phố không được quá 50 ký tự';
          } else if (!/^[a-zA-ZÀ-ỹ\s\-\.]+$/.test(value)) {
            newErrors.city = 'Tên thành phố chỉ được chứa chữ cái, khoảng trắng, dấu gạch ngang và dấu chấm';
          } else if (/^\s+|\s+$/.test(value)) {
            newErrors.city = 'Tên thành phố không được bắt đầu hoặc kết thúc bằng khoảng trắng';
          } else {
            delete newErrors.city;
          }
        } else {
          delete newErrors.city;
        }
        break;
        
      case 'province':
        if (value && value.trim().length > 0) {
          if (value.length < 2) {
            newErrors.province = 'Tên tỉnh/thành phố phải có ít nhất 2 ký tự';
          } else if (value.length > 50) {
            newErrors.province = 'Tên tỉnh/thành phố không được quá 50 ký tự';
          } else if (!/^[a-zA-ZÀ-ỹ\s\-\.]+$/.test(value)) {
            newErrors.province = 'Tên tỉnh/thành phố chỉ được chứa chữ cái, khoảng trắng, dấu gạch ngang và dấu chấm';
          } else if (/^\s+|\s+$/.test(value)) {
            newErrors.province = 'Tên tỉnh/thành phố không được bắt đầu hoặc kết thúc bằng khoảng trắng';
          } else {
            delete newErrors.province;
          }
        } else {
          delete newErrors.province;
        }
        break;
        
      case 'dateOfBirth':
        if (!value) {
          newErrors.dateOfBirth = 'Vui lòng chọn ngày sinh của bạn';
        } else {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (birthDate > today) {
            newErrors.dateOfBirth = 'Ngày sinh không thể là ngày trong tương lai';
          } else if (age < 13 || (age === 13 && monthDiff < 0)) {
            newErrors.dateOfBirth = 'Bạn phải đủ 13 tuổi để sử dụng dịch vụ';
          } else if (age > 100) {
            newErrors.dateOfBirth = 'Vui lòng kiểm tra lại ngày sinh (tuổi không hợp lệ)';
          } else if (isNaN(birthDate.getTime())) {
            newErrors.dateOfBirth = 'Định dạng ngày sinh không hợp lệ';
          } else {
            delete newErrors.dateOfBirth;
          }
        }
        break;
        
      case 'currentPassword':
        if (formData.newPassword && !value) {
          newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại để xác nhận';
        } else if (value && value.length < 6) {
          newErrors.currentPassword = 'Mật khẩu hiện tại không đúng định dạng (ít nhất 6 ký tự)';
        } else {
          delete newErrors.currentPassword;
        }
        break;
        
      case 'newPassword':
        if (value && value.length > 0) {
          if (value.length < 6) {
            newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
          } else if (value.length > 50) {
            newErrors.newPassword = 'Mật khẩu mới không được quá 50 ký tự';
          } else if (!/(?=.*[a-z])/.test(value)) {
            newErrors.newPassword = 'Mật khẩu mới phải chứa ít nhất 1 chữ cái thường (a-z)';
          } else if (!/(?=.*[A-Z])/.test(value)) {
            newErrors.newPassword = 'Mật khẩu mới phải chứa ít nhất 1 chữ cái hoa (A-Z)';
          } else if (!/(?=.*\d)/.test(value)) {
            newErrors.newPassword = 'Mật khẩu mới phải chứa ít nhất 1 chữ số (0-9)';
          } else if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(value)) {
            newErrors.newPassword = 'Mật khẩu mới nên chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)';
          } else if (value === formData.currentPassword) {
            newErrors.newPassword = 'Mật khẩu mới phải khác với mật khẩu hiện tại';
          } else if (/\s/.test(value)) {
            newErrors.newPassword = 'Mật khẩu mới không được chứa khoảng trắng';
          } else {
            delete newErrors.newPassword;
          }
        } else if (formData.currentPassword) {
          newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
        } else {
          delete newErrors.newPassword;
        }
        break;
        
      case 'confirmPassword':
        if (formData.newPassword && !value) {
          newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
        } else if (formData.newPassword && value !== formData.newPassword) {
          newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp với mật khẩu mới';
        } else if (value && value.length > 0 && !formData.newPassword) {
          newErrors.confirmPassword = 'Vui lòng nhập mật khẩu mới trước';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [errors, formData.newPassword]);

  
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      console.log("Preview URL:", previewUrl);
      setAvatarPreview(previewUrl);
      setFormData((prev) => ({ ...prev, avatar: file }));
    }
  }, []);

  const handleGetCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      showToast("Trình duyệt của bạn không hỗ trợ định vị", "error");
      return;
    }

    setIsGettingLocation(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
        });
      });

      const { latitude, longitude } = position.coords;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18&accept-language=vi`
      );

      if (!response.ok) throw new Error("Không thể lấy thông tin địa chỉ");

      const data = await response.json();
      const address = data.address;

      const city =
        address.city || address.town || address.village || address.suburb || "";
      const province = address.state || "";

      setFormData((prev) => ({
        ...prev,
        city,
        province,
      }));

      showToast("Đã cập nhật vị trí thành công", "success");
    } catch (error) {
      console.error("Error getting location:", error);
      showToast("Không thể lấy thông tin vị trí của bạn", "error");
    } finally {
      setIsGettingLocation(false);
    }
  }, [showToast]);

  const handleInputChange = useCallback((field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    
    setTimeout(() => {
      validateField(field, value);
    }, 300);
  }, [validateField]);

  const handleDateChange = useCallback((e) => {
    const dateValue = e.target.value;
    setFormData((prev) => ({ ...prev, dateOfBirth: dateValue }));
    
    
    const dateObj = dateValue ? new Date(dateValue) : null;
    validateField('dateOfBirth', dateObj);
  }, [validateField]);

  const handleGenderChange = useCallback((gender) => {
    setFormData((prev) => ({ ...prev, gender }));
    
    if (errors.gender) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.gender;
        return newErrors;
      });
    }
  }, [errors.gender]);

  const handleInterestAdd = useCallback((e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault();
      const newInterest = e.target.value.trim();
      if (!formData.interests.includes(newInterest)) {
        setFormData((prev) => ({
          ...prev,
          interests: [...prev.interests, newInterest],
        }));
      }
      e.target.value = "";
    }
  }, [formData.interests]);

  const handleInterestRemove = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index),
    }));
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    setErrors({});
    
    
    const validationErrors = {};
    let errorMessages = [];

    if (activeTab === "profile") {
      
      const fieldsToValidate = ['fullName', 'phone', 'dateOfBirth'];
      
      fieldsToValidate.forEach(field => {
        let valueToValidate = formData[field];
        
        
        if (field === 'dateOfBirth') {
          valueToValidate = formData[field] ? new Date(formData[field]) : null;
        }
        
        
        const validationResult = getValidationError(field, valueToValidate);
        if (validationResult) {
          validationErrors[field] = validationResult;
          errorMessages.push(`• ${validationResult}`);
        }
      });
      
      
      if (!formData.gender) {
        validationErrors.gender = 'Vui lòng chọn giới tính';
        errorMessages.push('• Vui lòng chọn giới tính');
      }
      
      
      ['bio', 'city', 'province'].forEach(field => {
        if (formData[field]) {
          const validationResult = getValidationError(field, formData[field]);
          if (validationResult) {
            validationErrors[field] = validationResult;
            errorMessages.push(`• ${validationResult}`);
          }
        }
      });
      
      if (Object.keys(validationErrors).length > 0) {
        
        setErrors(validationErrors);
        
        
        const errorMessage = "Vui lòng kiểm tra lại thông tin:\n" + errorMessages.join("\n");
        showToast(errorMessage, "error");
        return;
      }
      
    } else if (formData.newPassword || formData.currentPassword) {
      
      const passwordFields = ['currentPassword', 'newPassword', 'confirmPassword'];
      
      passwordFields.forEach(field => {
        const validationResult = getValidationError(field, formData[field]);
        if (validationResult) {
          validationErrors[field] = validationResult;
          errorMessages.push(`• ${validationResult}`);
        }
      });
      
      if (Object.keys(validationErrors).length > 0) {
        
        setErrors(validationErrors);
        
        
        const errorMessage = "Vui lòng kiểm tra lại thông tin mật khẩu:\n" + errorMessages.join("\n");
        showToast(errorMessage, "error");
        return;
      }
    }

    let submitData;
    if (activeTab === "password") {
      
      const { currentPassword, newPassword } = formData;
      submitData = {
        currentPassword,
        newPassword,
      };
    } else {
      
      submitData = { ...formData };
      
      
      if (submitData.dateOfBirth) {
        submitData.dateOfBirth = new Date(submitData.dateOfBirth);
      }
      
      delete submitData.currentPassword;
      delete submitData.newPassword;
      delete submitData.confirmPassword;
    }

    try {
      await onSubmit(submitData);

      
      if (activeTab === "password") {
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }
    } catch (error) {
      
    }
  };

  
  const interestTags = useMemo(() =>
    formData.interests.map((interest, index) => (
      <div
        key={`${interest}-${index}`}
        className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md flex items-center text-sm"
        style={{
          transform: `rotate(${randomOffsets[(index + 5) % randomOffsets.length]})`,
        }}
      >
        <span>{interest}</span>
        <button
          type="button"
          className="ml-1 text-blue-600 hover:text-blue-800"
          onClick={() => handleInterestRemove(index)}
        >
          <X size={14} />
        </button>
      </div>
    )),
    [formData.interests, handleInterestRemove]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa hồ sơ">
      {/* Add CSS for Vietnamese date format */}
      <style jsx>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.5);
        }
        
        input[type="date"]::-webkit-datetime-edit-text {
          color: #6b7280;
        }
        
        input[type="date"]::-webkit-datetime-edit-month-field,
        input[type="date"]::-webkit-datetime-edit-day-field,
        input[type="date"]::-webkit-datetime-edit-year-field {
          color: #1f2937;
        }
        
        input[type="date"]:focus::-webkit-datetime-edit-month-field,
        input[type="date"]:focus::-webkit-datetime-edit-day-field,
        input[type="date"]:focus::-webkit-datetime-edit-year-field {
          color: #2563eb;
        }
        
        /* Force Vietnamese date format */
        input[type="date"] {
          text-align: left;
          font-variant-numeric: tabular-nums;
        }
      `}</style>

      <div className="mb-4 border-b flex items-end space-x-1">
        <TabItem
          active={activeTab === "profile"}
          icon={User}
          label="Thông tin cá nhân"
          onClick={() => handleTabChange("profile")}
        />

        <TabItem
          active={activeTab === "password"}
          icon={Lock}
          label="Đổi mật khẩu"
          onClick={() => handleTabChange("password")}
        />
      </div>

      <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-1 py-2 custom-scrollbar" style={{ scrollbarGutter: "stable" }}>
        {activeTab === "profile" ? (
          <div className="space-y-6">
            {/* Avatar section */}
            <div className="flex justify-center mb-6">
              <div
                className="relative group"
                style={{ transform: `rotate(${randomOffsets[0]})` }}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-75 blur-sm group-hover:opacity-100 transition duration-200"></div>
                <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                  <label className="absolute bottom-1 right-1 bg-blue-600 p-2 rounded-full cursor-pointer shadow-md hover:bg-blue-700 transition-all duration-150 hover:scale-105 active:scale-95">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    <Camera className="text-white h-4 w-4" />
                  </label>
                </div>
              </div>
            </div>

            {/* Basic information section */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
                <User size={18} className="mr-2 text-blue-500" />
                Thông tin cơ bản
              </h3>

              <div className="space-y-4">
                <FormField 
                  icon={User} 
                  label="Họ tên đầy đủ" 
                  required 
                  offsetIndex={1}
                  error={errors.fullName}
                >
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange("fullName")}
                    placeholder="Nhập họ tên đầy đủ của bạn"
                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 bg-gray-50/50 transition-colors ${
                      errors.fullName 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    required
                  />
                </FormField>

                <FormField 
                  icon={Phone} 
                  label="Số điện thoại" 
                  required 
                  offsetIndex={2}
                  error={errors.phone}
                >
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange("phone")}
                    placeholder="Nhập số điện thoại (VD: 0912345678)"
                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 bg-gray-50/50 transition-colors ${
                      errors.phone 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    required
                  />
                </FormField>

                <FormField 
                  icon={Calendar} 
                  label="Ngày sinh" 
                  required 
                  offsetIndex={3}
                  error={errors.dateOfBirth}
                >
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleDateChange}
                    style={dateInputStyle}
                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 bg-gray-50/50 transition-colors ${
                      errors.dateOfBirth 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                    min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
                    pattern="\d{2}/\d{2}/\d{4}"
                    placeholder="dd/mm/yyyy"
                    title="Chọn ngày sinh của bạn"
                    required
                  />
                </FormField>

                <FormField 
                  icon={User} 
                  label="Giới tính" 
                  required 
                  offsetIndex={4}
                  error={errors.gender}
                >
                  <div className="flex space-x-4">
                    {genderOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`flex-1 flex items-center p-3 rounded-lg cursor-pointer border transition-all ${
                          formData.gender === option.value
                            ? "bg-blue-50 border-blue-300 shadow-sm"
                            : errors.gender
                            ? "bg-red-50 border-red-200 hover:bg-red-100"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={option.value}
                          checked={formData.gender === option.value}
                          onChange={() => handleGenderChange(option.value)}
                          className="sr-only"
                        />

                        <div
                          className={`w-4 h-4 rounded-full border flex-shrink-0 mr-2.5 ${
                            formData.gender === option.value
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-400"
                          }`}
                        >
                          {formData.gender === option.value && (
                            <div className="w-2 h-2 bg-white rounded-full m-auto"></div>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </FormField>
              </div>
            </div>

            {/* Additional information section */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
                <FileText size={18} className="mr-2 text-blue-500" />
                Thông tin bổ sung
              </h3>

              <div className="space-y-4">
                <FormField 
                  icon={FileText} 
                  label="Tiểu sử" 
                  offsetIndex={5}
                  error={errors.bio}
                >
                  <textarea
                    value={formData.bio}
                    onChange={handleInputChange("bio")}
                    placeholder="Viết gì đó về bản thân..."
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 bg-gray-50/50 transition-colors ${
                      errors.bio 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    rows="4"
                    maxLength={500}
                    style={{ resize: "vertical" }}
                  />
                  <p className={`text-xs mt-1 text-right ${
                    formData.bio.length > 450 ? 'text-orange-500' : 'text-gray-500'
                  }`}>
                    {formData.bio.length}/500 ký tự
                  </p>
                </FormField>

                <FormField icon={Tag} label="Sở thích" offsetIndex={6}>
                  <div className="bg-gray-50/50 p-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {interestTags}
                    </div>
                    <input
                      type="text"
                      placeholder={
                        formData.interests.length === 0
                          ? "Nhập sở thích và nhấn Enter để thêm"
                          : ""
                      }
                      className="w-full px-2 py-1.5 border-0 focus:outline-none focus:ring-0 bg-transparent"
                      onKeyDown={handleInterestAdd}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Nhập sở thích và ấn Enter
                  </p>
                </FormField>

                <FormField icon={MapPin} label="Vị trí" error={errors.city || errors.province}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-gray-500">
                        Thành phố, quận/huyện
                      </p>
                      <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={isGettingLocation}
                        className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                      >
                        <MapPin size={14} className="mr-1" />
                        {isGettingLocation
                          ? "Đang lấy vị trí..."
                          : "Lấy vị trí hiện tại"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={formData.city}
                        onChange={handleInputChange("city")}
                        placeholder="Thành phố"
                        className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 bg-gray-50/50 transition-colors ${
                          errors.city 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />

                      <input
                        type="text"
                        value={formData.province}
                        onChange={handleInputChange("province")}
                        placeholder="Tỉnh/Thành phố"
                        className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 bg-gray-50/50 transition-colors ${
                          errors.province 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                </FormField>

                <FormField icon={Heart} label="Trạng thái mối quan hệ">
                  <select
                    value={formData.relationshipStatus}
                    onChange={handleInputChange("relationshipStatus")}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                  >
                    {relationshipOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
              <Lock size={18} className="mr-2 text-blue-500" />
              Đổi mật khẩu
            </h3>

            <div className="space-y-4">
              <FormField
                icon={Lock}
                label="Mật khẩu hiện tại"
                required={!!formData.newPassword}
                error={errors.currentPassword}
              >
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange("currentPassword")}
                  placeholder="Nhập mật khẩu hiện tại"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 bg-gray-50/50 transition-colors ${
                    errors.currentPassword 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  required={!!formData.newPassword}
                />
              </FormField>

              <FormField
                icon={Lock}
                label="Mật khẩu mới"
                required={!!formData.currentPassword}
                error={errors.newPassword}
              >
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange("newPassword")}
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 bg-gray-50/50 transition-colors ${
                    errors.newPassword 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  required={!!formData.currentPassword}
                />
              </FormField>

              <FormField
                icon={Lock}
                label="Xác nhận mật khẩu mới"
                required={!!formData.newPassword}
                error={errors.confirmPassword}
              >
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange("confirmPassword")}
                  placeholder="Nhập lại mật khẩu mới"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 bg-gray-50/50 transition-colors ${
                    errors.confirmPassword 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  required={!!formData.newPassword}
                />
              </FormField>

              {/* Password security tips with enhanced guidance */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 text-sm">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                    <Lock size={12} className="text-white" />
                  </div>
                  <p className="font-semibold text-blue-900">
                    Yêu cầu mật khẩu an toàn:
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        formData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'
                      }`}></span>
                      <span className={formData.newPassword.length >= 6 ? 'text-green-700 font-medium' : ''}>
                        Ít nhất 6 ký tự
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        /(?=.*[a-z])/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'
                      }`}></span>
                      <span className={/(?=.*[a-z])/.test(formData.newPassword) ? 'text-green-700 font-medium' : ''}>
                        Chữ cái thường (a-z)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        /(?=.*[A-Z])/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'
                      }`}></span>
                      <span className={/(?=.*[A-Z])/.test(formData.newPassword) ? 'text-green-700 font-medium' : ''}>
                        Chữ cái hoa (A-Z)
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        /(?=.*\d)/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'
                      }`}></span>
                      <span className={/(?=.*\d)/.test(formData.newPassword) ? 'text-green-700 font-medium' : ''}>
                        Chữ số (0-9)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        /(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'
                      }`}></span>
                      <span className={/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.newPassword) ? 'text-green-700 font-medium' : ''}>
                        Ký tự đặc biệt (!@#$...)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        !/\s/.test(formData.newPassword) && formData.newPassword.length > 0 ? 'bg-green-500' : 'bg-gray-300'
                      }`}></span>
                      <span className={!/\s/.test(formData.newPassword) && formData.newPassword.length > 0 ? 'text-green-700 font-medium' : ''}>
                        Không chứa khoảng trắng
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <strong>Lưu ý:</strong> Mật khẩu mới phải khác với mật khẩu hiện tại
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6 mb-2 sticky bottom-0 bg-white p-3 shadow-md -mx-1 rounded-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center"
          >
            <X size={18} className="mr-1.5" />
            Hủy
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-sm flex items-center"
          >
            <Save size={18} className="mr-1.5" />
            Lưu thay đổi
          </button>
        </div>
      </form>
    </Modal>
  );
};

ProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  user: PropTypes.shape({
    fullName: PropTypes.string,
    phone: PropTypes.string,
    avatar: PropTypes.string,
    dateOfBirth: PropTypes.string,
    gender: PropTypes.string,
    bio: PropTypes.string,
    interests: PropTypes.arrayOf(PropTypes.string),
    city: PropTypes.string,
    province: PropTypes.string,
    relationshipStatus: PropTypes.string,
  }),
};

export default ProfileModal;
