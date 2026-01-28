import React from 'react';

/**
 * MOM Preview Component
 * Shows a complete preview of how the MOM will appear in the generated Word document
 * Includes discussion table and images
 */
const MOMPreview = ({ content, images = [], metadata = {} }) => {
  // Parse numbered points from content
  const parseDiscussionPoints = (text) => {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const points = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentPoint = null;

    lines.forEach(line => {
      // Match numbered patterns: "1.", "1)", "1:", "1 -", etc.
      const numberedMatch = line.match(/^(\d+)[\.\)\:\-\s]+(.+)$/);
      
      if (numberedMatch) {
        // Save previous point if exists
        if (currentPoint) {
          points.push(currentPoint);
        }
        
        // Start new point
        const number = numberedMatch[1];
        const pointText = numberedMatch[2].trim();
        
        currentPoint = {
          srNo: `${number}.`,
          point: pointText
        };
      } else if (currentPoint) {
        // Continue previous point (multi-line point)
        currentPoint.point += ' ' + line;
      } else {
        // No numbering detected, treat as single point
        if (points.length === 0) {
          currentPoint = {
            srNo: '1.',
            point: line
          };
        } else {
          // Add to last point
          if (points.length > 0) {
            points[points.length - 1].point += ' ' + line;
          }
        }
      }
    });

    // Add last point
    if (currentPoint) {
      points.push(currentPoint);
    }

    // If no points found, return content as single point
    if (points.length === 0 && text.trim().length > 0) {
      return [{
        srNo: '1.',
        point: text.trim()
      }];
    }

    return points;
  };

  const discussionPoints = parseDiscussionPoints(content);
  const hasContent = discussionPoints.length > 0;
  const hasImages = images && images.length > 0;

  if (!hasContent && !hasImages) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-xl p-6 border-2 border-orange-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-orange-600 text-white rounded-lg p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            📋 Document Preview
          </h3>
          <p className="text-sm text-gray-600">
            This is how your MOM will appear in the Word document
          </p>
        </div>
      </div>

      {/* Metadata Preview */}
      {metadata && Object.keys(metadata).length > 0 && (
        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">Meeting Information:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {metadata.title && (
              <div>
                <span className="text-gray-600">Title:</span>
                <span className="ml-2 font-medium">{metadata.title}</span>
              </div>
            )}
            {metadata.date && (
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium">{metadata.date}</span>
              </div>
            )}
            {metadata.time && (
              <div>
                <span className="text-gray-600">Time:</span>
                <span className="ml-2 font-medium">{metadata.time}</span>
              </div>
            )}
            {metadata.location && (
              <div>
                <span className="text-gray-600">Location:</span>
                <span className="ml-2 font-medium">{metadata.location}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discussion Table Preview */}
      {hasContent && (
        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-300">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold">
              TABLE PREVIEW
            </span>
            Discussion Points
          </h4>
          
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
                {discussionPoints.map((point, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-800 px-4 py-3 text-center font-bold text-sm">
                      {point.srNo}
                    </td>
                    <td className="border border-gray-800 px-4 py-3 text-sm leading-relaxed">
                      {point.point}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded border border-green-200">
            ✓ Detected {discussionPoints.length} discussion point{discussionPoints.length !== 1 ? 's' : ''}
            {discussionPoints.length > 0 && ' - Each point will appear in a separate row'}
          </div>
        </div>
      )}

      {/* Images Preview */}
      {hasImages && (
        <div className="bg-white rounded-lg p-4 border border-gray-300">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
              IMAGES
            </span>
            Construction Site Photos ({images.length})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <img
                    src={image.url}
                    alt={image.fileName || `Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="px-2 py-1.5 bg-white border-t border-gray-300">
                  <p className="text-xs text-gray-600 truncate">
                    📷 Image {index + 1}: {image.fileName || 'Untitled'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded border border-blue-200">
            ℹ️ These images will be inserted in the Word document after the discussion table
          </div>
        </div>
      )}

      {/* Preview Footer */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
        <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          This preview shows exactly how content will appear in the final Word document
        </p>
      </div>
    </div>
  );
};

export default MOMPreview;
