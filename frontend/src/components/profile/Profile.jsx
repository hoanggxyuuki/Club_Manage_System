"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import ProfileModal from "../common/Profile";
import { getProfile, updateProfile } from "../../services/api";
import { useNotification } from "../../context/NotificationContext";
import {
  UserCircleIcon,
  PencilIcon,
  CalendarIcon,
  MapPinIcon,
  HeartIcon,
  TagIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const Profile = () => {
  const { user, updateUserData, userData } = useAuth();
  const { showToast } = useNotification();
  const [profile, setProfile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const url = import.meta.env.VITE_PROXY_API_URL;
  
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  if (!user) return null;

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      showToast("Failed to load profile", "error", { style: { zIndex: 9999 } });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (formData) => {
    try {
      await updateProfile(formData);
      await loadProfile();
      await updateUserData();
      setShowModal(false);
      showToast("Profile updated successfully", "success", { style: { zIndex: 9999 } });
    } catch (err) {
      if (formData.currentPassword) {
        const errorMessage = err.message || "Có lỗi xảy ra";
        if (errorMessage.includes("current password")) {
          showToast("Mật khẩu hiện tại không đúng", "error", { style: { zIndex: 9999 } });
        } else {
          showToast(errorMessage, "error", { style: { zIndex: 9999 } });
        }
      } else {
        const errorMessage = err.message || "Có lỗi xảy ra";
        showToast(errorMessage, "error", { style: { zIndex: 9999 } });
      }
      throw err; 
    }
  };

  const getRelationshipLabel = useCallback((status) => {
    const statusMap = {
      single: "Độc thân",
      "in-relationship": "Đang hẹn hò",
      married: "Đã kết hôn",
      complicated: "Phức tạp",
      "prefer-not-to-say": "Không muốn tiết lộ",
    };
    return statusMap[status] || status;
  }, []);

  const getGenderLabel = useCallback((gender) => {
    const genderMap = {
      male: "Nam",
      female: "Nữ",
      other: "Khác",
    };
    return genderMap[gender] || gender;
  }, []);

  const ProfileField = React.memo(({ icon: Icon, label, value, className = "" }) => (
    <div className={`group ${className}`}>
      <div className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 hover:border-slate-300/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
          <p className="text-base text-slate-900 font-medium break-words">
            {value || "Chưa cập nhật"}
          </p>
        </div>
      </div>
    </div>
  ));

  const displayName = useMemo(() => 
    profile?.fullName || profile?.username, 
    [profile?.fullName, profile?.username]
  );

  const addressText = useMemo(() => 
    profile?.city || profile?.province 
      ? `${profile.city || ""} ${profile.province ? `, ${profile.province}` : ""}` 
      : null,
    [profile?.city, profile?.province]
  );

  const formattedBirthDate = useMemo(() => 
    profile?.dateOfBirth 
      ? format(new Date(profile.dateOfBirth), "dd MMMM yyyy", { locale: vi }) 
      : null,
    [profile?.dateOfBirth]
  );
  
  const memberSince = useMemo(() => 
    profile?.createdAt 
      ? format(new Date(profile.createdAt), "dd/MM/yyyy", { locale: vi })
      : null,
    [profile?.createdAt]
  );

  
  const interestsArray = useMemo(() => {
    if (!profile?.interests?.length) return [];
    
    
    if (Array.isArray(profile.interests) && profile.interests[0]?.includes(',')) {
      return profile.interests[0].split(',').map(item => item.trim()).filter(item => item);
    }
    
    
    return Array.isArray(profile.interests) ? profile.interests : [];
  }, [profile?.interests]);

  const avatarSrc = useMemo(() => 
    profile?.avatar ? `${url}${profile.avatar}` : null,
    [profile?.avatar, url]
  );

  
  const HeaderBackground = React.memo(() => (
    <div className="h-32 md:h-48 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 relative overflow-hidden">
      {/* Thay thế pattern phức tạp bằng pattern đơn giản hơn */}
      <div className="absolute inset-0 opacity-10 bg-blue-800/20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
    </div>
  ));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header Card */}
        <div className="mb-8 overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-xl">
          <HeaderBackground />

          <div className="px-6 md:px-8 pb-8 -mt-16 relative">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-6">
              <div className="relative">
                <div className="w-32 h-32 border-4 border-white shadow-2xl ring-4 ring-blue-100/50 rounded-full overflow-hidden">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                      {profile?.fullName?.charAt(0) || profile?.username?.charAt(0)}
                    </div>
                  )}
                </div>
                {/* <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div> */}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                      {displayName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-sm font-medium flex items-center">
                        <BriefcaseIcon className="w-3 h-3 mr-1" />
                        {profile?.role}
                      </span>
                      {profile?.relationshipStatus && (
                      <span className="px-3 py-1 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-sm font-medium flex items-center">
                          <HeartIcon className="w-3 h-3 mr-1" />
                          {getRelationshipLabel(profile.relationshipStatus)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </button>
                </div>

                {profile?.bio && (
                  <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50 p-4 rounded-lg border">
                    <p className="text-slate-700 italic leading-relaxed">"{profile.bio}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Info - Chỉ render khi có data */}
            <div className="flex flex-wrap gap-3">
              {profile?.email && (
                <div className="flex items-center px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-700 hover:bg-slate-200 transition-colors">
                  <EnvelopeIcon className="w-4 h-4 mr-2 text-blue-600" />
                  {profile.email}
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-700 hover:bg-slate-200 transition-colors">
                  <PhoneIcon className="w-4 h-4 mr-2 text-blue-600" />
                  {profile.phone}
                </div>
              )}
              {addressText && (
                <div className="flex items-center px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-700 hover:bg-slate-200 transition-colors">
                  <MapPinIcon className="w-4 h-4 mr-2 text-blue-600" />
                  {addressText}
                </div>
              )}
              {formattedBirthDate && (
                <div className="flex items-center px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-700 hover:bg-slate-200 transition-colors">
                  <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                  {formattedBirthDate}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <div className="lg:col-span-2">
            <div className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-xl">
              <div className="p-6 md:p-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3">
                    <UserCircleIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Thông tin cá nhân</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProfileField
                    icon={UserCircleIcon}
                    label="Họ và tên"
                    value={profile?.fullName}
                  />
                  <ProfileField
                    icon={UserCircleIcon}
                    label="Username"
                    value={profile?.username}
                  />
                  <ProfileField
                    icon={UserCircleIcon}
                    label="Giới tính"
                    value={profile?.gender ? getGenderLabel(profile.gender) : null}
                  />
                  <ProfileField
                    icon={CalendarIcon}
                    label="Ngày sinh"
                    value={formattedBirthDate}
                  />
                  <ProfileField
                    icon={HeartIcon}
                    label="Trạng thái mối quan hệ"
                    value={profile?.relationshipStatus ? getRelationshipLabel(profile.relationshipStatus) : null}
                  />
                  <ProfileField
                    icon={MapPinIcon}
                    label="Địa chỉ"
                    value={addressText}
                  />
                  <ProfileField
                    icon={EnvelopeIcon}
                    label="Email"
                    value={profile?.email}
                    className="md:col-span-2"
                  />
                  <ProfileField
                    icon={PhoneIcon}
                    label="Số điện thoại"
                    value={profile?.phone}
                  />
                  <ProfileField
                    icon={BriefcaseIcon}
                    label="Vai trò"
                    value={profile?.role}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interests - Chỉ render khi có interests */}
          <div className="space-y-8">
            {interestsArray.length > 0 && (
              <div className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-xl">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mr-3">
                      <TagIcon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Sở thích</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interestsArray.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 hover:from-purple-200 hover:to-pink-200 transition-all duration-300 hover:scale-105 border rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stats Card */}
            <div className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-4">Thống kê</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Thành viên từ</span>
                    <span className="font-semibold">{memberSince || "N/A"}</span>
                  </div>
                  <div className="border-t border-blue-400/30"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Sở thích</span>
                    <span className="font-semibold">{interestsArray.length}</span>
                  </div>
                  <div className="border-t border-blue-400/30"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Trạng thái</span>
                    <span className="bg-green-500 hover:bg-green-600 px-2 py-1 rounded text-xs">Hoạt động</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleUpdateProfile}
        user={profile}
      />
    </div>
  );
};

export default Profile;
