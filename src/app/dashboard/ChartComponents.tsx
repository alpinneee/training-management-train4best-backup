"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#4338ca", "#fb923c", "#fbbf24", "#10b981", "#8b5cf6"];

interface TrainingDataItem {
  name: string;
  value: number;
}

interface CertificationTypeItem {
  name: string;
  value: number;
}

interface StatisticsChartProps {
  trainingData?: TrainingDataItem[];
}

interface DistributionChartProps {
  certificationTypeData?: CertificationTypeItem[];
}

export function StatisticsChart({ trainingData = [] }: StatisticsChartProps) {
  if (!trainingData || trainingData.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={trainingData}
        margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis 
          dataKey="name" 
          fontSize={10} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#6b7280' }} 
        />
        <YAxis 
          fontSize={10} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#6b7280' }} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            fontSize: '12px' 
          }}
          cursor={{ fill: 'rgba(229, 231, 235, 0.4)' }} 
        />
        <Bar 
          dataKey="value" 
          fill="#4338ca" 
          radius={[4, 4, 0, 0]} 
          barSize={25} 
          animationDuration={1500}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DistributionChart({ certificationTypeData = [] }: DistributionChartProps) {
  if (!certificationTypeData || certificationTypeData.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>;
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#fff" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={10}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Pie
          data={certificationTypeData}
          cx="50%"
          cy="50%"
          innerRadius={35}
          outerRadius={60}
          fill="#8884d8"
          dataKey="value"
          labelLine={false}
          label={renderCustomizedLabel}
          animationDuration={1500}
          animationBegin={200}
        >
          {certificationTypeData?.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]} 
              stroke="none" 
            />
          ))}
        </Pie>
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right" 
          formatter={(value, entry) => {
            return <span style={{ fontSize: '10px', color: '#4b5563' }}>{value}</span>;
          }}
          wrapperStyle={{ fontSize: '10px', paddingLeft: '10px' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            fontSize: '10px' 
          }} 
        />
      </PieChart>
    </ResponsiveContainer>
  );
} 