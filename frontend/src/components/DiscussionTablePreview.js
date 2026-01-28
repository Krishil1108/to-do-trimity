import React from 'react';

/**
 * Discussion Table Preview Component
 * Shows a preview of how the discussion points will appear in the generated Word document
 */
const DiscussionTablePreview = ({ content }) => {
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

  if (discussionPoints.length === 0) {
    return null;
  }

  return (
    <div className="discussion-table-preview" style={{
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '8px'
    }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '15px',
        color: '#333'
      }}>
        📋 Table Preview (How it will appear in Word document)
      </h3>
      
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '12px',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '2px solid #333'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{
                width: '80px',
                border: '1px solid #333',
                padding: '10px',
                textAlign: 'left',
                fontWeight: 'bold',
                fontSize: '13px'
              }}>
                Sr. No.
              </th>
              <th style={{
                border: '1px solid #333',
                padding: '10px',
                textAlign: 'left',
                fontWeight: 'bold',
                fontSize: '13px'
              }}>
                Point of discussion/ Observation
              </th>
            </tr>
          </thead>
          <tbody>
            {discussionPoints.map((point, index) => (
              <tr key={index}>
                <td style={{
                  border: '1px solid #333',
                  padding: '10px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'
                }}>
                  {point.srNo}
                </td>
                <td style={{
                  border: '1px solid #333',
                  padding: '10px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'
                }}>
                  {point.point}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: '10px',
        fontSize: '12px',
        color: '#666',
        fontStyle: 'italic'
      }}>
        ✓ Detected {discussionPoints.length} discussion point{discussionPoints.length !== 1 ? 's' : ''}
        {discussionPoints.length > 0 && ' - Each point will appear in a separate row'}
      </div>
    </div>
  );
};

export default DiscussionTablePreview;
