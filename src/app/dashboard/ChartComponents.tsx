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
} from "recharts";
import Card from "@/components/common/card";

const COLORS = ["#4338ca", "#fb923c", "#fbbf24"];

interface ChartProps {
  trainingData: Array<{name: string, value: number}>;
  certificationTypeData: Array<{name: string, value: number}>;
  variants: any;
  itemVariants: any;
}

export function StatisticsChart({ trainingData, variants, itemVariants }: Partial<ChartProps>) {
  return (
    <Card className="p-2"> {/* Reduced padding */}
      <h2 className="text-base font-bold mb-1 text-gray-700"> {/* Reduced text and margin */}
        Monthly Training Statistics
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={trainingData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={10} />
          <YAxis fontSize={10} />
          <Bar dataKey="value" fill="#4338ca" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function DistributionChart({ certificationTypeData, variants, itemVariants }: Partial<ChartProps>) {
  return (
    <Card className="p-2"> {/* Reduced padding */}
      <h2 className="text-base font-bold text-gray-700 mb-2"> {/* Reduced text size */}
        Training Type Distribution
      </h2>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={certificationTypeData}
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius={50}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {certificationTypeData?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
} 