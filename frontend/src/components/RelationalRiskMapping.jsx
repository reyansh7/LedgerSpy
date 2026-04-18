import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'framer-motion';

const RelationalRiskMapping = ({ graphData = { nodes: [], links: [] } }) => {
  const fgRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = Math.max(400, window.innerWidth - 100);
      setDimensions({ width, height: 600 });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!fgRef.current) return;
    try {
      const fg = fgRef.current;

      // Configure force simulation for clustering Bad Actors
      // Strong negative charge pushes nodes apart initially
      fg.d3Force('charge').strength(-300);

      // Variable link distance - bad actors pull closer
      fg.d3Force('link')
        .distance((link) => {
          const sourceRisk = link.source.riskScore || 0;
          const targetRisk = link.target.riskScore || 0;
          const maxRisk = Math.max(sourceRisk, targetRisk);
          // High-risk connections: 40px, Low-risk: 120px (creates clustering)
          return 40 + ((100 - maxRisk) / 100) * 80;
        })
        .strength((link) => getLinkStrength(link));

      // Collision detection with risk-based radius
      if (fg.d3Force('collide')) {
        fg.d3Force('collide').radius((node) => getNodeSize(node) + 8);
      }
    } catch (e) {
      console.warn('Force configuration error:', e);
    }
  }, [graphData]);

  // Calculate node size based on risk score - High-risk nodes are 3x larger (Gatekeepers)
  const getNodeSize = (node) => {
    const riskScore = node.riskScore || 0;
    // Base size: 6px for low-risk, scales up to 18px for high-risk (3x multiplier)
    if (riskScore > 80) return 18; // 3x larger for critical "Bad Actors"
    if (riskScore > 50) return 12; // 2x for high-risk
    return 6; // Normal size for low-risk
  };

  // Get node color based on risk level - Updated with exact colors
  const getNodeColor = (node) => {
    const riskScore = node.riskScore || 0;
    if (riskScore > 80) return '#FF3131';    // Bright Neon Red for critical
    if (riskScore >= 50) return '#FFAC1C';   // Orange for high-risk
    return '#00e676'; // Green for low-risk
  };

  // Calculate link strength based on node risk - Bad actors pull together
  const getLinkStrength = (link) => {
    const sourceRisk = link.source.riskScore || 0;
    const targetRisk = link.target.riskScore || 0;
    const maxRisk = Math.max(sourceRisk, targetRisk);

    // Higher risk connections have stronger pull (0.1 to 0.9)
    return 0.1 + (maxRisk / 100) * 0.8;
  };

  // Handle node hover
  const handleNodeHover = (node) => {
    setHoveredNode(node);
    if (node) {
      setTooltip({
        visible: true,
        x: 0,
        y: 0,
        data: node,
      });
    } else {
      setTooltip({ visible: false, data: null });
    }
  };

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        background: 'linear-gradient(135deg, rgba(15, 18, 35, 0.8), rgba(20, 25, 45, 0.8))',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '1rem',
      }}>
        No relationship data available
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'linear-gradient(135deg, rgba(10, 12, 25, 0.9), rgba(15, 18, 35, 0.9))',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.05))',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '1.2rem',
          fontWeight: 700,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          🔗 Relational Risk Mapping
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.5)',
            marginLeft: 'auto',
          }}>
            {graphData.nodes.length} entities • {graphData.links.length} connections
          </span>
        </h3>
      </div>

      {/* Graph Canvas */}
      <div style={{ position: 'relative', width: '100%', height: '600px', background: 'rgba(10, 12, 25, 0.95)' }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={{
            ...graphData,
            nodes: graphData.nodes.map((node) => ({
              ...node,
              val: getNodeSize(node), // Use nodeVal for force-graph sizing
            })),
          }}
          nodeCanvasObject={(node, ctx) => {
            const size = getNodeSize(node);
            const color = getNodeColor(node);
            const isHighRisk = node.riskScore > 80;

            // Enhanced glow effect for high-risk nodes (Bad Actors)
            if (isHighRisk) {
              // Outer glow - larger blur
              ctx.shadowBlur = 30;
              ctx.shadowColor = color;
              ctx.globalAlpha = 0.4;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, size * 1.6, 0, 2 * Math.PI);
              ctx.fill();

              // Inner glow - medium blur
              ctx.shadowBlur = 15;
              ctx.shadowColor = color;
              ctx.globalAlpha = 0.7;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, size * 1.2, 0, 2 * Math.PI);
              ctx.fill();
            }

            // Main node
            ctx.shadowBlur = isHighRisk ? 25 : 12;
            ctx.shadowColor = color;
            ctx.globalAlpha = 1;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
            ctx.fill();

            // Bright border for high-risk nodes
            ctx.strokeStyle = isHighRisk ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)';
            ctx.lineWidth = isHighRisk ? 2 : 1;
            ctx.stroke();

            // Reset shadow
            ctx.shadowBlur = 0;
          }}
          linkCanvasObject={(link, ctx) => {
            const sourceRisk = link.source.riskScore || 0;
            const targetRisk = link.target.riskScore || 0;
            const maxRisk = Math.max(sourceRisk, targetRisk);

            // Link color and width based on risk - Bad Actor connections are more visible
            const alpha = 0.1 + (maxRisk / 100) * 0.6;
            const width = 0.5 + (maxRisk / 100) * 3;

            ctx.strokeStyle = `rgba(255, 49, 49, ${alpha})`;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(link.source.x, link.source.y);
            ctx.lineTo(link.target.x, link.target.y);
            ctx.stroke();
          }}
          nodePointerAreaPaint={() => { }}
          onNodeHover={handleNodeHover}
          width={dimensions.width}
          height={600}
          nodeRelSize={1} // Use val property instead
          linkWidth={1}
          warmupTicks={100} // Let simulation settle for better clustering
          cooldownTicks={300}
          backgroundColor="rgba(10, 12, 25, 0.95)"
        />

        {/* Tooltip */}
        {tooltip.visible && tooltip.data && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute',
              right: '20px',
              top: '20px',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, rgba(20, 25, 45, 0.95), rgba(30, 35, 60, 0.95))',
              border: tooltip.data.riskScore > 80
                ? '2px solid #FF3131'
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '14px 16px',
              backdropFilter: 'blur(10px)',
              boxShadow: tooltip.data.riskScore > 80
                ? '0 0 20px rgba(255, 49, 49, 0.5)'
                : 'none',
            }}>
              <div style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '8px',
              }}>
                {tooltip.data.riskScore > 80 && '🚨 '}{tooltip.data.name}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: getNodeColor(tooltip.data),
                fontWeight: 700,
              }}>
                Risk Score: {Math.round(tooltip.data.riskScore || 0)}%
              </div>
              {tooltip.data.riskScore > 80 && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#FF3131',
                  marginTop: '6px',
                  fontWeight: 600,
                }}>
                  ⚠ BAD ACTOR - HIGH FRAUD RISK
                </div>
              )}
              {tooltip.data.group && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '6px',
                }}>
                  Type: {tooltip.data.group}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(15, 18, 35, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)',
          fontSize: '0.8rem',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: '10px' }}>
            Risk Levels & Node Size
          </div>
          {[
            { color: '#FF3131', label: 'Critical (>80) - 3x Size', size: 18 },
            { color: '#FFAC1C', label: 'High (50-80) - 2x Size', size: 12 },
            { color: '#00e676', label: 'Low (<50) - Normal Size', size: 6 },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: `${item.size}px`,
                height: `${item.size}px`,
                borderRadius: '50%',
                background: item.color,
                boxShadow: item.color === '#FF3131'
                  ? `0 0 15px ${item.color}cc, inset 0 0 8px ${item.color}66`
                  : `0 0 6px ${item.color}66`,
              }} />
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
            </div>
          ))}
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: '1.4',
          }}>
            <strong>🔴 Red nodes are "Bad Actors"</strong>
            <br />Strong links show transaction flow between high-risk entities
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RelationalRiskMapping;
