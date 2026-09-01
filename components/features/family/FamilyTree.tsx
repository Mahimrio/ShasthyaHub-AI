'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Pill,
  AlertTriangle,
  HeartPulse,
  CheckCircle2,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { RELATIONS_MAP, getRelationLabel } from '@/lib/family/relations'
import type { FamilyTreeNode } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface FamilyTreeProps {
  treeData: {
    self: FamilyTreeNode
    allNodes?: FamilyTreeNode[]
    otherNodes?: FamilyTreeNode[]
    members?: FamilyTreeNode[]
    generations?: Record<string, FamilyTreeNode[]>
    totalMembers?: number
    totalConnected?: number
    hasUrgentAlerts?: boolean
  }
  onSelectMember: (memberId: string) => void
  onAddMember: () => void
}

interface PositionedOrbNode {
  node: FamilyTreeNode
  x: number
  y: number
  radius: number
  angleDeg: number
  gradient: string
  borderColor: string
  accentColor: string
  ringCategory: string
}

export function FamilyTree({ treeData, onSelectMember, onAddMember }: FamilyTreeProps) {
  const { lang } = useLanguage()
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 860,
    height: 640,
  })

  // Dynamic Responsive Resize Observer
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current
        setDimensions({
          width: Math.max(340, clientWidth),
          height: Math.max(520, Math.min(840, clientHeight || 640)),
        })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    const observer = new ResizeObserver(handleResize)
    if (containerRef.current) observer.observe(containerRef.current)

    return () => {
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
    }
  }, [])

  const self = treeData?.self
  const otherNodes = useMemo(() => treeData?.otherNodes || treeData?.members || [], [treeData])
  const hasRelatives = otherNodes.length > 0

  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.4, z + 0.1))
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.65, z - 0.1))
  const handleResetZoom = () => setZoomLevel(1)

  // =========================================================================
  // DYNAMIC BALANCED RADIAL CONSTELLATION ALGORITHM (NO OVERLAPPING)
  // =========================================================================
  const { width, height } = dimensions
  const cx = width / 2
  const cy = height / 2

  const minDim = Math.min(width, height)
  const scale = Math.max(0.75, Math.min(1.2, minDim / 660))

  const nodeSize = Math.round(Math.max(64, Math.min(88, 76 * scale)))
  const selfSize = Math.round(Math.max(88, Math.min(116, 98 * scale)))

  // Concentric Orbit Radii
  const rInner = Math.round(Math.max(130, Math.min(210, minDim * 0.29)))
  const rOuter = Math.round(Math.max(200, Math.min(320, minDim * 0.44)))

  const totalMembers = treeData?.totalMembers ?? (otherNodes.length + (self ? 1 : 0))

  // Balanced radial positioning ensuring distinct angles per node
  const positionedNodes = useMemo(() => {
    const list: PositionedOrbNode[] = []
    if (otherNodes.length === 0) return list

    // Group nodes into generational rings
    const elders = otherNodes.filter((n) => n.generation < 0) // Parents, Grandparents, Uncles
    const peers = otherNodes.filter((n) => n.generation === 0) // Siblings, Spouse, Cousins
    const youngers = otherNodes.filter((n) => n.generation > 0) // Children, Grandchildren

    // Helper to assign visual gradient & theme by relation
    const getTheme = (node: FamilyTreeNode) => {
      const gen = node.generation
      if (gen === -2) {
        return {
          gradient: 'from-purple-500 via-indigo-500 to-purple-600',
          borderColor: 'border-purple-400 dark:border-purple-500',
          accentColor: '#a855f7',
          ringCategory: lang === 'bn' ? 'দাদা-দাদী' : 'Grandparents',
        }
      }
      if (gen === -1) {
        return {
          gradient: 'from-sky-500 via-cyan-500 to-teal-500',
          borderColor: 'border-sky-400 dark:border-sky-500',
          accentColor: '#0ea5e9',
          ringCategory: lang === 'bn' ? 'মা-বাবা' : 'Parents & Elders',
        }
      }
      if (gen === 0) {
        return {
          gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
          borderColor: 'border-emerald-400 dark:border-emerald-500',
          accentColor: '#10b981',
          ringCategory: lang === 'bn' ? 'সহোদর / সমবয়সী' : 'Peers',
        }
      }
      if (gen === 1) {
        return {
          gradient: 'from-amber-400 via-orange-500 to-amber-500',
          borderColor: 'border-amber-400 dark:border-amber-500',
          accentColor: '#f59e0b',
          ringCategory: lang === 'bn' ? 'সন্তান' : 'Children',
        }
      }
      return {
        gradient: 'from-pink-400 via-rose-500 to-pink-500',
        borderColor: 'border-pink-400 dark:border-pink-500',
        accentColor: '#ec4899',
        ringCategory: lang === 'bn' ? 'নাতি-নাতনি' : 'Grandchildren',
      }
    }

    // Distribute Elders in top hemisphere (-160° to -20°)
    if (elders.length > 0) {
      const startAngle = -160
      const endAngle = -20
      const step = elders.length === 1 ? 0 : (endAngle - startAngle) / (elders.length - 1)

      elders.forEach((node, i) => {
        // Stagger grandparents vs parents radius so they never collide
        const r = node.generation === -2 ? rOuter : rInner
        // Offset angle slightly if both generations are present
        const angle = elders.length === 1
          ? (node.generation === -2 ? -65 : -115) // Spread single elder nodes across two distinct angles!
          : startAngle + step * i

        const rad = (angle * Math.PI) / 180
        const theme = getTheme(node)

        list.push({
          node,
          x: cx + r * Math.cos(rad),
          y: cy + r * Math.sin(rad),
          radius: r,
          angleDeg: angle,
          ...theme,
        })
      })
    }

    // Distribute Peers in horizontal quadrants (Left: 145° to 195°, Right: -15° to 35°)
    if (peers.length > 0) {
      const leftPeers = peers.slice(0, Math.ceil(peers.length / 2))
      const rightPeers = peers.slice(Math.ceil(peers.length / 2))

      const placePeerSector = (items: FamilyTreeNode[], start: number, end: number) => {
        const step = items.length === 1 ? 0 : (end - start) / (items.length - 1)
        items.forEach((node, i) => {
          const angle = items.length === 1 ? (start + end) / 2 : start + step * i
          const rad = (angle * Math.PI) / 180
          const theme = getTheme(node)
          list.push({
            node,
            x: cx + rInner * Math.cos(rad),
            y: cy + rInner * Math.sin(rad),
            radius: rInner,
            angleDeg: angle,
            ...theme,
          })
        })
      }

      if (leftPeers.length > 0) placePeerSector(leftPeers, 145, 195)
      if (rightPeers.length > 0) placePeerSector(rightPeers, -15, 35)
    }

    // Distribute Youngers in bottom hemisphere (40° to 140°)
    if (youngers.length > 0) {
      const startAngle = 45
      const endAngle = 135
      const step = youngers.length === 1 ? 0 : (endAngle - startAngle) / (youngers.length - 1)

      youngers.forEach((node, i) => {
        const r = node.generation === 2 ? rOuter : rInner
        const angle = youngers.length === 1
          ? (node.generation === 2 ? 65 : 115)
          : startAngle + step * i

        const rad = (angle * Math.PI) / 180
        const theme = getTheme(node)

        list.push({
          node,
          x: cx + r * Math.cos(rad),
          y: cy + r * Math.sin(rad),
          radius: r,
          angleDeg: angle,
          ...theme,
        })
      })
    }

    return list
  }, [otherNodes, cx, cy, rInner, rOuter, lang])

  return (
    <div className="relative w-full rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-gradient-to-b from-white via-sky-50/25 to-slate-50/60 dark:from-gray-950 dark:via-gray-900/90 dark:to-gray-950 shadow-xs overflow-hidden flex flex-col transition-all">
      {/* Subtle Dot Mesh Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#0284c714_1px,transparent_1px)] [background-size:22px_22px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] bg-sky-400/8 dark:bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Controls Bar */}
      <div className="relative z-20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200/60 dark:border-gray-800/80 backdrop-blur-md bg-white/75 dark:bg-gray-900/75">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-500/15 shrink-0">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                {lang === 'bn' ? 'পারিবারিক বৃত্তাকার নেটওয়ার্ক' : 'Family Health Network'}
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 rounded-full px-2 py-0.5">
                {totalMembers} {lang === 'bn' ? 'সদস্য' : 'Members'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lang === 'bn'
                ? 'পরিবারের প্রতিটি বৃত্তাকার সদস্যে ক্লিক করে ওষুধের রুটিন ও স্বাস্থ্য রিপোর্ট দেখুন'
                : 'Click on any circular member to monitor medication schedules & health reports'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-0.5 shadow-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="h-7 w-7 p-0 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] font-mono font-bold px-1.5 text-gray-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="h-7 w-7 p-0 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="h-7 w-7 p-0 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              title="Reset Zoom"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>

          <Button
            size="sm"
            onClick={onAddMember}
            className="h-8 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-bold text-xs shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>{lang === 'bn' ? 'সদস্য যুক্ত করুন' : 'Add Member'}</span>
          </Button>
        </div>
      </div>

      {/* Main Responsive Circular Stage */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full overflow-hidden flex items-center justify-center min-h-[540px]"
      >
        <motion.div
          animate={{ scale: zoomLevel }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="relative origin-center select-none w-full h-full flex items-center justify-center"
          style={{ width, height }}
        >
          {/* SVG Orbit Tracks & Clean Connector Curves */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`}>
            <defs>
              <linearGradient id="orbitGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="urgentGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* Inner Generation Track Circle */}
            <circle
              cx={cx}
              cy={cy}
              r={rInner}
              fill="none"
              stroke="currentColor"
              className="text-sky-400/20 dark:text-sky-500/15"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Outer Generation Track Circle */}
            <circle
              cx={cx}
              cy={cy}
              r={rOuter}
              fill="none"
              stroke="currentColor"
              className="text-purple-400/15 dark:text-purple-500/15"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />

            {/* Smooth Quadratic Bezier Curves Connecting Center to Each Circular Orb */}
            {positionedNodes.map((pn) => {
              const isHovered = hoveredNodeId === pn.node.userId
              const isUrgent = pn.node.healthSummary?.hasUrgentCondition

              // Smooth curved trajectory
              const midX = (cx + pn.x) / 2
              const midY = (cy + pn.y) / 2
              const curveStrength = 0.1
              const dx = pn.x - cx
              const dy = pn.y - cy
              const cpX = midX - dy * curveStrength
              const cpY = midY + dx * curveStrength

              return (
                <g key={`curve-${pn.node.userId}`}>
                  <path
                    d={`M ${cx} ${cy} Q ${cpX} ${cpY} ${pn.x} ${pn.y}`}
                    fill="none"
                    stroke={isUrgent ? 'url(#urgentGlowGradient)' : 'url(#orbitGlowGradient)'}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    strokeDasharray={isUrgent ? 'none' : '3 3'}
                    className="transition-all duration-300"
                  />
                  <circle
                    cx={cpX}
                    cy={cpY}
                    r={isHovered ? 3.5 : 2}
                    fill={isUrgent ? '#f43f5e' : pn.accentColor}
                    className="animate-pulse"
                  />
                </g>
              )
            })}
          </svg>

          {/* ============================================================= */}
          {/* CENTER CIRCULAR ORB: SELF (YOU)                              */}
          {/* ============================================================= */}
          <motion.div
            style={{
              left: cx - selfSize / 2,
              top: cy - selfSize / 2,
              width: selfSize,
              height: selfSize,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => self && onSelectMember(self.userId)}
            className="absolute z-30 flex flex-col items-center justify-center cursor-pointer group"
          >
            {/* Center Pulsing Glow Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-400 via-teal-400 to-emerald-400 opacity-25 blur-lg group-hover:opacity-45 animate-pulse transition-opacity" />
            <div className="absolute -inset-1 rounded-full border-2 border-dashed border-sky-400/40 animate-[spin_24s_linear_infinite]" />

            {/* Circular Disc Core */}
            <div className="relative w-full h-full rounded-full bg-white dark:bg-gray-900 border-2 border-sky-400 dark:border-sky-500 shadow-lg shadow-sky-500/20 p-1 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 flex flex-col items-center justify-center text-white text-center shadow-inner">
                <span className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                  {self?.name?.[0]?.toUpperCase() || 'Y'}
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mt-0.5 opacity-90">
                  {lang === 'bn' ? 'আপনি' : 'YOU'}
                </span>
              </div>

              <div className="absolute -bottom-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                {lang === 'bn' ? 'মূল কেন্দ্র' : 'Center'}
              </div>
            </div>

            {/* Central Name Badge */}
            <div className="mt-2.5 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-gray-800/90 border border-sky-200 dark:border-sky-800 shadow-xs pointer-events-none">
              <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 truncate max-w-[120px] text-center">
                {self?.name || (lang === 'bn' ? 'আপনি (স্বয়ং)' : 'You (Self)')}
              </p>
            </div>
          </motion.div>

          {/* ============================================================= */}
          {/* ORBITING PURE CIRCULAR FAMILY MEMBER ORBS                     */}
          {/* ============================================================= */}
          {positionedNodes.map((pn, idx) => {
            const node = pn.node
            const health = node.healthSummary
            const isHovered = hoveredNodeId === node.userId
            const isUrgent = health?.hasUrgentCondition
            const medCount = health?.activeMedications?.length || 0

            const meta = RELATIONS_MAP[node.relation] || {
              badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
            }

            return (
              <motion.div
                key={node.id}
                style={{
                  left: pn.x - nodeSize / 2,
                  top: pn.y - nodeSize / 2,
                  width: nodeSize,
                  height: nodeSize,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: [0, -3, 0],
                }}
                transition={{
                  scale: { type: 'spring', damping: 22, stiffness: 220, delay: idx * 0.05 },
                  y: { repeat: Infinity, duration: 4 + (idx % 3), ease: 'easeInOut', delay: idx * 0.2 },
                }}
                whileHover={{ scale: 1.15, zIndex: 40 }}
                onHoverStart={() => setHoveredNodeId(node.userId)}
                onHoverEnd={() => setHoveredNodeId(null)}
                onClick={() => onSelectMember(node.userId)}
                className="absolute z-20 flex flex-col items-center justify-center cursor-pointer group"
              >
                {/* Urgent Ring Halo */}
                {isUrgent && (
                  <div className="absolute inset-0 rounded-full bg-rose-500 opacity-35 blur-md animate-ping pointer-events-none" />
                )}

                {/* Pure Circular Disc with Gradient Avatar Ring */}
                <div
                  className={`relative w-full h-full rounded-full p-1 transition-all duration-300 shadow-md ${
                    isUrgent
                      ? 'bg-rose-500/20 border-2 border-rose-500 shadow-rose-500/25'
                      : isHovered
                      ? 'bg-sky-500/20 border-2 border-sky-400 shadow-sky-500/30'
                      : 'bg-white dark:bg-gray-900 border-2 ' + pn.borderColor + ' shadow-gray-200/50 dark:shadow-none hover:border-sky-400'
                  }`}
                >
                  {/* Inside Avatar Circle */}
                  <div
                    className={`w-full h-full rounded-full bg-gradient-to-br ${pn.gradient} flex items-center justify-center text-white text-base sm:text-lg font-black shadow-inner`}
                  >
                    {node.name?.[0]?.toUpperCase() || 'U'}
                  </div>

                  {/* Top-Right Medicine Pill Badge */}
                  {medCount > 0 ? (
                    <div
                      className="absolute -top-1.5 -right-1.5 bg-white dark:bg-gray-800 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-700 rounded-full text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 shadow-xs flex items-center gap-0.5"
                      title={`${medCount} active medications`}
                    >
                      <Pill className="h-2.5 w-2.5" />
                      <span>{medCount}</span>
                    </div>
                  ) : (
                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    </div>
                  )}

                  {/* Urgent Warning Flag */}
                  {isUrgent && (
                    <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-xs animate-bounce">
                      <AlertTriangle className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {/* Attached Compact Pill for Name & Relation */}
                <div className="mt-1.5 px-2 py-0.5 rounded-full bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col items-center pointer-events-none max-w-[110px]">
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-900 dark:text-gray-100 truncate w-full text-center group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {node.name}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-medium text-gray-500 dark:text-gray-400 truncate w-full text-center">
                    {getRelationLabel(node.relation, lang)}
                  </span>
                </div>

                {/* Floating Rich Tooltip on Hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.94 }}
                      className="absolute bottom-full mb-3 p-3 rounded-2xl bg-gray-900/95 dark:bg-gray-800/95 text-white backdrop-blur-md shadow-xl border border-gray-700/60 w-48 text-left z-50 pointer-events-none"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold truncate">{node.name}</p>
                        <Badge variant="outline" className={`text-[8px] px-1 py-0 ${meta.badgeColor}`}>
                          {getRelationLabel(node.relation, lang)}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-sky-400 font-mono mt-0.5 truncate">
                        {node.email || (node.username ? `@${node.username}` : '')}
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-300">
                        <span>{lang === 'bn' ? 'ওষুধ রুটিন:' : 'Medications:'}</span>
                        <span className="font-bold text-white">{medCount} {lang === 'bn' ? 'টি' : 'items'}</span>
                      </div>
                      <p className="text-[9px] text-gray-400 mt-1 text-center font-medium">
                        {lang === 'bn' ? 'ক্লিক করে সম্পূর্ণ স্বাস্থ্য রেকর্ড দেখুন' : 'Click to inspect full health routine'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {/* Empty State Prompt */}
          {!hasRelatives && (
            <div className="absolute inset-x-0 bottom-8 sm:bottom-12 flex flex-col items-center justify-center text-center pointer-events-none">
              <div className="p-4 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-800 max-w-sm pointer-events-auto shadow-lg">
                <Sparkles className="h-6 w-6 text-sky-500 mx-auto mb-1.5" />
                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {lang === 'bn' ? 'আপনার পারিবারিক নেটওয়ার্ক তৈরি করুন' : 'Your Family Circle is Ready'}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {lang === 'bn'
                    ? 'মা-বাবা বা স্বজনদের জিমেইল দিয়ে আমন্ত্রণ পাঠিয়ে এই বৃত্তাকার ট্রিতে যুক্ত করুন।'
                    : 'Invite your parents or family members via Gmail or username to see them in this circle.'}
                </p>
                <Button
                  size="sm"
                  onClick={onAddMember}
                  className="mt-2.5 h-7 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  <span>{lang === 'bn' ? 'প্রথম সদস্য যুক্ত করুন' : 'Add First Member'}</span>
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Orbit Legend & Status Bar */}
      <div className="relative z-20 px-5 py-3 border-t border-gray-200/60 dark:border-gray-800 bg-white/75 dark:bg-gray-900/75 backdrop-blur-md flex items-center justify-between gap-4 flex-wrap text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-gray-800 dark:text-gray-200">{lang === 'bn' ? 'প্রজন্ম বৃত্ত:' : 'Generations:'}</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>{lang === 'bn' ? 'দাদা-দাদী (-২)' : 'Grandparents'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>{lang === 'bn' ? 'মা-বাবা (-১)' : 'Parents & Elders'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{lang === 'bn' ? 'সহোদর / সমবয়সী (০)' : 'Peers'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>{lang === 'bn' ? 'সন্তান (+১)' : 'Children'}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            <span>{lang === 'bn' ? 'রিপোর্ট স্বাভাবিক' : 'Normal'}</span>
          </span>
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
            <AlertTriangle className="h-3 w-3" />
            <span>{lang === 'bn' ? 'জরুরি দৃষ্টি প্রয়োজন' : 'Needs Attention'}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
