
import { useEffect, useState } from "react";

interface FloatingNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export const FloatingNetworkAnimation = () => {
  const [nodes, setNodes] = useState<FloatingNode[]>([]);

  useEffect(() => {
    // Initialize floating nodes
    const initialNodes: FloatingNode[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 4 + 3,
      opacity: Math.random() * 0.5 + 0.5,
    }));
    setNodes(initialNodes);

    const interval = setInterval(() => {
      setNodes(prevNodes =>
        prevNodes.map(node => {
          let newX = node.x + node.vx;
          let newY = node.y + node.vy;
          let newVx = node.vx;
          let newVy = node.vy;

          // Bounce off edges
          if (newX <= 0 || newX >= 100) {
            newVx = -newVx;
            newX = Math.max(0, Math.min(100, newX));
          }
          if (newY <= 0 || newY >= 100) {
            newVy = -newVy;
            newY = Math.max(0, Math.min(100, newY));
          }

          return {
            ...node,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          };
        })
      );
    }, 60);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      {/* Enhanced Floating Network Animation */}
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%" className="absolute inset-0">
          {/* Enhanced connections between nearby nodes */}
          {nodes.map((node, i) =>
            nodes.slice(i + 1).map((otherNode, j) => {
              const distance = Math.sqrt(
                Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
              );
              if (distance < 25) {
                return (
                  <line
                    key={`${i}-${j}`}
                    x1={`${node.x}%`}
                    y1={`${node.y}%`}
                    x2={`${otherNode.x}%`}
                    y2={`${otherNode.y}%`}
                    stroke="rgba(147, 51, 234, 0.6)"
                    strokeWidth="2"
                    className="animate-pulse"
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(147, 51, 234, 0.8))',
                      animationDuration: '3s',
                      animationDelay: `${(i + j) * 0.3}s`
                    }}
                  />
                );
              }
              return null;
            })
          )}
          
          {/* Enhanced glowing nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              {/* Outer glow */}
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={node.size * 2}
                fill="rgba(147, 51, 234, 0.2)"
                className="animate-pulse"
                style={{
                  filter: 'blur(4px)',
                  opacity: node.opacity * 0.7,
                  animationDelay: `${node.id * 0.15}s`,
                  animationDuration: '2s'
                }}
              />
              {/* Main node */}
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={node.size}
                fill="rgba(147, 51, 234, 0.9)"
                className="animate-pulse"
                style={{
                  opacity: node.opacity,
                  animationDelay: `${node.id * 0.2}s`,
                  filter: 'drop-shadow(0 0 6px rgba(147, 51, 234, 1))',
                }}
              />
              {/* Inner bright core */}
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={node.size * 0.4}
                fill="rgba(255, 255, 255, 0.8)"
                className="animate-pulse"
                style={{
                  animationDelay: `${node.id * 0.25}s`,
                  animationDuration: '1.5s'
                }}
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
