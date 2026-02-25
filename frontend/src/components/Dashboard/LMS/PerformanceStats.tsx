
import React from "react";
import { Link } from "react-router-dom";

const PerformanceStats: React.FC = () => {
  return (
    <>
      <div className="trezo-card bg-white dark:bg-[#0c1427] h-full p-[20px] md:p-[25px] rounded-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-blue-50 dark:hover:bg-[#15203c]">

        <div className="trezo-card-header mb-[20px] md:mb-[25px]">
          <h5 className="!mb-[5px] text-xl font-bold">My Results</h5>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Track your performance and progress
          </p>
        </div>

        <div className="trezo-card-content">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8 text-center">
            {/* Average Score */}
            <div className="flex flex-col items-center">
              <div className="w-[50px] h-[50px] rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-2">
                <i className="material-symbols-outlined text-[24px]">target</i>
              </div>
              <h3 className="text-2xl font-bold mb-1">75%</h3>
              <span className="text-xs text-gray-500 font-medium">Average Score</span>
            </div>

            {/* Best Rank */}
            <div className="flex flex-col items-center">
              <div className="w-[50px] h-[50px] rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-2">
                <i className="material-symbols-outlined text-[24px]">workspace_premium</i>
              </div>
              <h3 className="text-2xl font-bold mb-1">#142</h3>
              <span className="text-xs text-gray-500 font-medium">Best Rank</span>
            </div>

            {/* Tests Taken */}
            <div className="flex flex-col items-center">
              <div className="w-[50px] h-[50px] rounded-full bg-teal-100 text-teal-500 flex items-center justify-center mb-2">
                <i className="material-symbols-outlined text-[24px]">schedule</i>
              </div>
              <h3 className="text-2xl font-bold mb-1">28</h3>
              <span className="text-xs text-gray-500 font-medium">Tests Taken</span>
            </div>

            {/* Improvement */}
            <div className="flex flex-col items-center">
              <div className="w-[50px] h-[50px] rounded-full bg-green-100 text-green-500 flex items-center justify-center mb-2">
                <i className="material-symbols-outlined text-[24px]">trending_up</i>
              </div>
              <h3 className="text-2xl font-bold mb-1">+12%</h3>
              <span className="text-xs text-gray-500 font-medium">Improvement</span>
            </div>
          </div>

          <h6 className="text-[16px] font-bold mb-4">Recent Test Performance</h6>

          {/* Test List */}
          <div className="space-y-6">
            {/* Test 1 */}
            <div>
              <div className="flex justify-between items-start mb-1">
                <h6 className="font-semibold text-[15px]">JEE Advanced Mock Test 13</h6>
                <span className="font-bold text-[16px]">85/100</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500">Physics • Jan 10, 2025</p>
                <span className="text-xs text-gray-500">Rank: #142</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "85%" }}></div>
              </div>
            </div>

            {/* Test 2 */}
            <div>
              <div className="flex justify-between items-start mb-1">
                <h6 className="font-semibold text-[15px]">JEE Advanced Mock Test 12</h6>
                <span className="font-bold text-[16px]">72/100</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500">Chemistry • Jan 8, 2025</p>
                <span className="text-xs text-gray-500">Rank: #289</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "72%" }}></div>
              </div>
            </div>

            {/* Test 3 */}
            <div>
              <div className="flex justify-between items-start mb-1">
                <h6 className="font-semibold text-[15px]">JEE Advanced Mock Test 11</h6>
                <span className="font-bold text-[16px]">68/100</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500">Mathematics • Jan 5, 2025</p>
                <span className="text-xs text-gray-500">Rank: #356</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "68%" }}></div>
              </div>
            </div>

            {/* Test 4 */}
            <div>
              <div className="flex justify-between items-start mb-1">
                <h6 className="font-semibold text-[15px]">JEE Advanced Mock Test 10</h6>
                <span className="font-bold text-[16px]">65/100</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500">Physics • Jan 2, 2025</p>
                <span className="text-xs text-gray-500">Rank: #412</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "65%" }}></div>
              </div>
            </div>

            {/* Test 5 */}
            <div>
              <div className="flex justify-between items-start mb-1">
                <h6 className="font-semibold text-[15px]">JEE Advanced Mock Test 9</h6>
                <span className="font-bold text-[16px]">60/100</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500">Chemistry • Dec 30, 2024</p>
                <span className="text-xs text-gray-500">Rank: #520</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "60%" }}></div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link to="#" className="block w-full py-3 border border-primary-500 text-primary-500 font-semibold text-center rounded-lg hover:bg-primary-50 transition-colors">
              View All Results
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PerformanceStats;
