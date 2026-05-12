import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Package, Settings, ShieldCheck, Activity, DollarSign
} from 'lucide-react';

const STAGES = [
  {
    num: '01',
    title: 'Strategy &\nAssessment',
    shortTitle: 'Strategy',
    description: 'Market scan & opportunity analysis',
    icon: TrendingUp,
    path: '/stage/01',
    color: '#00338D',
    hoverColor: '#0044b8',
  },
  {
    num: '02',
    title: 'Supply Chain\nSourcing',
    shortTitle: 'Sourcing',
    description: 'Components, requirements & selection',
    icon: Package,
    path: '/stage/02',
    color: '#0055A4',
    hoverColor: '#0066c4',
  },
  {
    num: '03',
    title: 'Design &\nBuild',
    shortTitle: 'Design & Build',
    description: 'Architecture & construction requirements',
    icon: Settings,
    path: '/stage/03',
    color: '#00529B',
    hoverColor: '#0063bb',
  },
  {
    num: '04',
    title: 'Compliance\nChecks',
    shortTitle: 'Compliance',
    description: 'Tax, regulatory, ESG & cyber',
    icon: ShieldCheck,
    path: '/stage/04',
    color: '#1B3A5C',
    hoverColor: '#234d7a',
  },
  {
    num: '05',
    title: 'DC\nOperations',
    shortTitle: 'Operations',
    description: 'Efficiency, DCIM & uptime management',
    icon: Activity,
    path: '/stage/05',
    color: '#003580',
    hoverColor: '#0044a0',
  },
  {
    num: '06',
    title: 'DC\nMonetization',
    shortTitle: 'Monetization',
    description: 'Revenue models & market positioning',
    icon: DollarSign,
    path: '/stage/06',
    color: '#0077C8',
    hoverColor: '#0088e0',
  },
];

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, outerR, innerR, startAngle, endAngle) {
  const s1 = polarToCartesian(cx, cy, outerR, startAngle);
  const e1 = polarToCartesian(cx, cy, outerR, endAngle);
  const s2 = polarToCartesian(cx, cy, innerR, endAngle);
  const e2 = polarToCartesian(cx, cy, innerR, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${s1.x} ${s1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${e2.x} ${e2.y}`,
    'Z',
  ].join(' ');
}

function SliceLabel({ cx, cy, startAngle, endAngle, outerR, innerR, stage, isHovered }) {
  const midAngle = (startAngle + endAngle) / 2;
  const labelR = (outerR + innerR) / 2;
  const pos = polarToCartesian(cx, cy, labelR, midAngle);

  const Icon = stage.icon;

  // Rotate text to be readable
  const rotation = midAngle > 90 && midAngle < 270 ? midAngle + 90 : midAngle - 90;

  return (
    <g transform={`translate(${pos.x}, ${pos.y})`}>
      {/* Icon circle */}
      <circle r={isHovered ? 18 : 15} fill="rgba(255,255,255,0.15)" />
      <foreignObject x={isHovered ? -9 : -7.5} y={isHovered ? -9 : -7.5} width={isHovered ? 18 : 15} height={isHovered ? 18 : 15}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <Icon size={isHovered ? 12 : 10} color="white" strokeWidth={2.5} />
        </div>
      </foreignObject>
    </g>
  );
}

export default function LifecycleWheel({ onCenterClick }) {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [clickedIndex, setClickedIndex] = useState(null);

  const SIZE = 520;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const OUTER_R = 220;
  const INNER_R = 100;
  const GAP = 3;

  const sliceAngle = 360 / STAGES.length;

  const handleSliceClick = useCallback((stage, index) => {
    setClickedIndex(index);
    setTimeout(() => {
      navigate(stage.path);
    }, 400);
  }, [navigate]);

  return (
    <div className="relative select-none" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="overflow-visible"
      >
        <defs>
          {STAGES.map((s, i) => (
            <radialGradient key={i} id={`slice-grad-${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={s.hoverColor} />
              <stop offset="100%" stopColor={s.color} />
            </radialGradient>
          ))}
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="10" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring glow */}
        <circle cx={CX} cy={CY} r={OUTER_R + 8} fill="none" stroke="rgba(0,119,200,0.12)" strokeWidth={16} />
        <circle cx={CX} cy={CY} r={OUTER_R + 2} fill="none" stroke="rgba(0,119,200,0.06)" strokeWidth={4} />

        {/* Slices */}
        {STAGES.map((stage, i) => {
          const startAngle = i * sliceAngle + GAP;
          const endAngle = (i + 1) * sliceAngle - GAP;
          const path = describeArc(CX, CY, OUTER_R, INNER_R, startAngle, endAngle);
          const isHovered = hoveredIndex === i;
          const isOtherHovered = hoveredIndex !== null && hoveredIndex !== i;
          const isClicked = clickedIndex === i;

          const midAngle = (startAngle + endAngle) / 2;
          const expandVec = polarToCartesian(0, 0, isClicked ? 18 : isHovered ? 10 : 0, midAngle);

          return (
            <motion.g
              key={i}
              className="wheel-slice"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: isOtherHovered ? 0.55 : 1 }}
              transition={{
                delay: 2.2 + i * 0.15,
                duration: 0.5,
                type: 'spring',
                stiffness: 200,
                damping: 20,
                opacity: { duration: 0.2 },
              }}
              style={{ transformOrigin: `${CX}px ${CY}px` }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleSliceClick(stage, i)}
            >
              <motion.g
                animate={{
                  x: expandVec.x,
                  y: expandVec.y,
                }}
                transition={{ duration: 0.2 }}
              >
                <path
                  d={path}
                  fill={`url(#slice-grad-${i})`}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1.5}
                  filter={isHovered || isClicked ? 'url(#glow)' : undefined}
                />
                {/* Hover highlight overlay */}
                {isHovered && (
                  <path
                    d={path}
                    fill="rgba(255,255,255,0.1)"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={1.5}
                  />
                )}

                {/* Stage number */}
                {(() => {
                  const numAngle = (startAngle + endAngle) / 2;
                  const numPos = polarToCartesian(CX, CY, OUTER_R - 22, numAngle);
                  return (
                    <text
                      x={numPos.x}
                      y={numPos.y + 4}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.5)"
                      fontSize="10"
                      fontFamily="'JetBrains Mono', monospace"
                      fontWeight="600"
                    >
                      {stage.num}
                    </text>
                  );
                })()}

                {/* Stage title — horizontal */}
                {(() => {
                  const titleAngle = (startAngle + endAngle) / 2;
                  const labelR = (OUTER_R + INNER_R) / 2 + 8;
                  const pos = polarToCartesian(CX, CY, labelR, titleAngle);
                  const lines = stage.title.split('\n');

                  return (
                    <g transform={`translate(${pos.x}, ${pos.y})`}>
                      {lines.map((line, li) => (
                        <text
                          key={li}
                          x={0}
                          y={(li - (lines.length - 1) / 2) * 13}
                          textAnchor="middle"
                          fill="white"
                          fontSize={isHovered ? "11" : "10"}
                          fontFamily="'Plus Jakarta Sans', sans-serif"
                          fontWeight="700"
                          letterSpacing="0.2"
                        >
                          {line}
                        </text>
                      ))}
                    </g>
                  );
                })()}
              </motion.g>
            </motion.g>
          );
        })}

        {/* Inner circle — KPMG center */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6, type: 'spring', stiffness: 200 }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
          className="cursor-pointer"
          onClick={onCenterClick}
        >
          {/* Pulsing ring */}
          <motion.circle
            cx={CX} cy={CY} r={INNER_R - 2}
            fill="none"
            stroke="rgba(0,119,200,0.4)"
            strokeWidth={2}
            animate={{ r: [INNER_R - 2, INNER_R + 6, INNER_R - 2], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <circle cx={CX} cy={CY} r={INNER_R - 4} fill="#0D1428" />
          <circle cx={CX} cy={CY} r={INNER_R - 8} fill="url(#center-grad)" />

          <defs>
            <radialGradient id="center-grad" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#0077C8" />
              <stop offset="100%" stopColor="#00338D" />
            </radialGradient>
          </defs>

          <text
            x={CX} y={CY - 6}
            textAnchor="middle"
            fill="white"
            fontSize="22"
            fontFamily="'Plus Jakarta Sans', sans-serif"
            fontWeight="800"
            letterSpacing="1"
          >
            KPMG
          </text>
          <text
            x={CX} y={CY + 10}
            textAnchor="middle"
            fill="rgba(255,255,255,0.6)"
            fontSize="8"
            fontFamily="'DM Sans', sans-serif"
            fontWeight="500"
            letterSpacing="1.5"
          >
            INTELLIGENCE
          </text>
          <text
            x={CX} y={CY + 22}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="7"
            fontFamily="'DM Sans', sans-serif"
            fontWeight="400"
            letterSpacing="1"
          >
            Click for platform overview
          </text>
        </motion.g>

        {/* Connector spokes */}
        {STAGES.map((_, i) => {
          const angle = i * sliceAngle;
          const inner = polarToCartesian(CX, CY, INNER_R - 4, angle);
          const outer = polarToCartesian(CX, CY, OUTER_R + 1, angle);
          return (
            <motion.line
              key={`spoke-${i}`}
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0 + i * 0.1 }}
            />
          );
        })}
      </svg>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-4 pointer-events-none"
            style={{ top: SIZE + 12 }}
          >
            <div className="glass-dark rounded-xl px-4 py-3 text-center min-w-[200px]">
              <div className="text-[#0077C8] text-xs font-mono font-bold mb-0.5">
                STAGE {STAGES[hoveredIndex].num}
              </div>
              <div className="text-white font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {STAGES[hoveredIndex].shortTitle}
              </div>
              <div className="text-white/50 text-xs mt-1">
                {STAGES[hoveredIndex].description}
              </div>
              <div className="text-[#0077C8] text-xs mt-2 font-medium">Click to explore →</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
