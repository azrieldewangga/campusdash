import { useEffect } from 'react';
import { useStore } from '../store/useStore';
// Recharts removed as IPS trend is gone
import { useNavigate } from 'react-router-dom';
import NearestDeadlineCard from '../components/dashboard/NearestDeadlineCard';
import GlassCard from '../components/shared/GlassCard';
import CreditCard from '../components/dashboard/CreditCard';
import TaskBoard from '../components/dashboard/TaskBoard';

const Dashboard = () => {
    const { grades, fetchGrades, userProfile, getSemesterCourses } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchGrades();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Deadlines & Balance */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                    {/* Nearest Deadlines */}
                    <div className="h-72">
                        <NearestDeadlineCard />
                    </div>

                    {/* Balance / Credit Card */}
                    <div className="h-56 w-full mt-auto">
                        <CreditCard />
                    </div>
                </div>

                {/* Right Column: Task Status Board */}
                <GlassCard className="lg:col-span-2 h-full">
                    <TaskBoard />
                </GlassCard>

            </div>
        </div>
    );
};

export default Dashboard;
