import React from 'react'
import StatsCard from '../Components/StatsCards/StatsCard'
import ChartCard from '../Components/Projects/ChartCard/ChartCard';
import './Reports.css'

const Reports = () => {
  return (
    <div className='report-page-container'>
        <StatsCard />
        <ChartCard />
    </div>
  )
}

export default Reports