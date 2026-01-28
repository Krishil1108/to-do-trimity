import React from 'react';

/**
 * Processed Discussion Table Preview Component
 * Shows the AI-processed tabular discussion points exactly as they will appear in Word document
 */
const ProcessedDiscussionTable = ({ tableData }) => {
  if (!tableData || tableData.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-green-600 text-white rounded-lg p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            ✅ AI-Processed Discussion Table
          </h3>
          <p className="text-sm text-gray-600">
            This is exactly how your table will appear in the Word document
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-300">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-800">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-800 px-4 py-3 text-left font-bold text-sm w-24">
                  Sr. No.
                </th>
                <th className="border border-gray-800 px-4 py-3 text-left font-bold text-sm">
                  Point of discussion/ Observation
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-800 px-4 py-3 text-center font-bold text-sm">
                    {row.srNo}.
                  </td>
                  <td className="border border-gray-800 px-4 py-3 text-sm leading-relaxed">
                    {row.processedPoint}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded border border-green-200">
          ✓ Processed {tableData.length} discussion point{tableData.length !== 1 ? 's' : ''} with AI enhancement
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
        <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          AI has enhanced your text for grammar, clarity, and professionalism
        </p>
      </div>
    </div>
  );
};

export default ProcessedDiscussionTable;
