import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getMemberMetrics } from "../../../services/achievement";
import { getMemberDetails } from "../../../services/members";
import PerformanceMetrics from "../../../components/member/Achievements/PerformanceMetrics";
import AchievementManager from "../../../components/member/Achievements/AchievementManager";
import { toast } from "react-toastify";

const AchievementsPage = () => {
  const { memberId } = useParams();
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  const isLeaderOrAdmin = user?.role === "leader" || user?.role === "admin";
  const targetMemberId = memberId || user?.id;

  useEffect(() => {
    if (targetMemberId) {
      fetchData();
    }
  }, [targetMemberId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      
      if (isLeaderOrAdmin) {
        const metricsData = await getMemberMetrics(targetMemberId);
        setMetrics(metricsData);
      }

      
      const memberData = await getMemberDetails(targetMemberId);
      setMember(memberData);
    } catch (error) {
      toast.error("Không thể tải thông tin thành tích");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!member) {
    return <div>Không tìm thấy thông tin thành viên</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Thành tích - {member.userId?.username || "Unknown"}
        </h1>
        {member.secondaryRole && (
          <p className="text-gray-600">Vai trò: {member.secondaryRole}</p>
        )}
      </div>

      <div className="space-y-6">
        {/* Performance Metrics - Only visible to leaders/admins */}
        {isLeaderOrAdmin && metrics && <PerformanceMetrics metrics={metrics} />}

        {/* Achievement Manager - Only visible to leaders/admins */}
        {isLeaderOrAdmin && <AchievementManager memberId={targetMemberId} />}

        {/* For regular members, show only their earned achievements */}
        {!isLeaderOrAdmin && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Thành tích của bạn</h2>
            {/* Achievement list component will be rendered here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPage;
