import './Dashboard.css';
import StatsCard from '../Components/StatsCards/StatsCard';
import ChartCard from '../Components/Projects/ChartCard/ChartCard';
import TaskAlertPanel from '../Components/Dashboard/TaskAlertPanel';
import { useEffect, useState } from 'react';
import axios from "axios";
import { useAuth } from '../context/AuthContext';

function Dashboard() {

   const {fetchManager, fetchOpics, fetchStatsOfProject} = useAuth();

  useEffect(()=>{
    fetchStatsOfProject();
    fetchManager();
    fetchOpics();
  }, [])
  
  return (
        <div className="dashboard-content">
        <StatsCard />
        <ChartCard />
        <TaskAlertPanel />
        </div>
  );
}

export default Dashboard;

