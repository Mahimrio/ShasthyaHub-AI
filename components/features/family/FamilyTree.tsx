'use client'

import { useState, useRef } from 'react'
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

interface CircularNodePosition {
  node: FamilyTreeNode
  x: number
  y: number
  radius: number
  angleDeg: number
  tier: 'parents' | 'peers' | 'children' | 'grandparents' | 'grandchildren' | 'extended'
}

export function FamilyTree({ treeData, onSelectMember, onAddMember }: FamilyTreeProps) {
  const { lang } = useLanguage()
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const self = treeData?.self
  const otherNodes = treeData?.otherNodes || treeData?.members || []
  const hasRelatives = otherNodes && otherNodes.length > 0

  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.4, z + 0.1))
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.65, z - 0.1))
  const handleResetZoom = () => setZoomLevel(1)

  // Canvas Dimensions
  const W = 880
  const H = 680
  const CX = W / 2
  const CY = H / 2

  // Orbits Radii
  const R_INNER = 180 // Parents, Peers, Children
  const R_OUTER = 295 // Grandparents, Grandchildren, Extended

  // Group members by generations
  const grandparents = treeData?.generations?.grandparents || otherNodes.filter((n) => n.generation === -2) || []
  const parents = treeData?.generations?.parents || otherNodes.filter((n) => n.generation === -1) || []
  const peers = (treeData?.generations?.peers || otherNodes.filter((n) => n.generation === 0) || []).filter((n) => !n.isCurrentUser)
  const children = treeData?.generations?.children || otherNodes.filter((n) => n.generation === 1) || []
  const grandchildren = treeData?.generations?.grandchildren || otherNodes.filter((n) => n.generation === 2) || []
  const totalMembers = treeData?.totalMembers ?? (otherNodes.length + (self ? 1 : 0))

  // Calculate circular coordinates for all nodes
  const circularNodes: CircularNodePosition[] = []

  const placeArc = (
    nodes: FamilyTreeNode[],
    startDeg: number,
    endDeg: number,
    radius: number,
    tier: CircularNodePosition['tier']
  ) => {
    if (nodes.length === 0) return
    if (nodes.length === 1) {
      const mid = (startDeg + endDeg) / 2
      const rad = (mid * Math.PI) / 180
      circularNodes.push({
        node: nodes[0],
        x: CX + radius * Math.cos(rad),
        y: CY + radius * Math.sin(rad),
        radius,
        angleDeg: mid,
        tier,
      })
      return
    }

    const step = (endDeg - startDeg) / (nodes.length - 1 || 1)
    nodes.forEach((node, i) => {
      const deg = startDeg + step * i
      const rad = (deg * Math.PI) / 180
      circularNodes.push({
        node,
        x: CX + radius * Math.cos(rad),
        y: CY + radius * Math.sin(rad),
        radius,
        angleDeg: deg,
        tier,
      })
    })
  }

  // 1. Grandparents (Outer Top Arc: -150° to -30°)
  placeArc(grandparents, -150, -30, R_OUTER, 'grandparents')

  // 2. Parents & Elders (Inner Top Arc: -155° to -25°)
  placeArc(parents, -155, -25, R_INNER, 'parents')

  // 3. Peers & Siblings (Inner Sides: Left 145° to 195°, Right -15° to 35°)
  if (peers.length > 0) {
    const half = Math.ceil(peers.length / 2)
    placeArc(peers.slice(0, half), 145, 195, R_INNER, 'peers')
    placeArc(peers.slice(half), -15, 35, R_INNER, 'peers')
  }

  // 4. Children (Inner Bottom Arc: 50° to 130°)
  placeArc(children, 50, 130, R_INNER, 'children')

  // 5. Grandchildren (Outer Bottom Arc: 35° to 145°)
  placeArc(grandchildren, 35, 145, R_OUTER, 'grandchildren')

  // Catch-all unplaced
  const placedSet = new Set(circularNodes.map((c) => c.node.userId))
  const remaining = otherNodes.filter((n) => !placedSet.has(n.userId))
  if (remaining.length > 0) {
    placeArc(remaining, 0, 360, R_OUTER, 'extended')
  }

  return (
    <div className="relative w-full rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-gradient-to-b from-slate-50/80 via-sky-50/30 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 shadow-sm overflow-hidden min-h-[640px] flex flex-col">
      {/* Subtle Radial Mesh Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#0284c710_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-sky-400/5 dark:bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Interactive Floating Controls */}
      <div className="relative z-20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200/60 dark:border-gray-800/80 backdrop-blur-md bg-white/60 dark:bg-gray-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-500/15">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                {lang === 'bn' ? 'পারিবারিক বৃত্তাকার নেটওয়ার্ক' : 'Family Health Circle'}
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 rounded-full px-2 py-0.5">
                {totalMembers} {lang === 'bn' ? 'সদস্য' : 'Members'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lang === 'bn'
                ? 'পরিবারের প্রতিটি বৃত্তে ক্লিক করে ওষুধের রুটিন ও স্বাস্থ্য রিপোর্ট দেখুন'
                : 'Click on any family member circle to monitor medication routines and health'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Zoom Controls */}
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

      {/* Main Interactive Circular Stage */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full overflow-auto flex items-center justify-center p-4 min-h-[560px]"
      >
        <motion.div
          animate={{ scale: zoomLevel }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="relative origin-center select-none"
          style={{ width: W, height: H }}
        >
          {/* SVG Orbit Tracks & Smooth Bezier Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${W} ${H}`}>
            <defs>
              <linearGradient id="orbitGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="urgentGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Orbit Circle 1: Inner Generation Ring */}
            <circle
              cx={CX}
              cy={CY}
              r={R_INNER}
              fill="none"
              stroke="currentColor"
              className="text-sky-400/20 dark:text-sky-500/20"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Orbit Circle 2: Outer Generation Ring */}
            <circle
              cx={CX}
              cy={CY}
              r={R_OUTER}
              fill="none"
              stroke="currentColor"
              className="text-purple-400/20 dark:text-purple-500/20"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />

            {/* Orbit Ring Subtle Labels */}
            <text
              x={CX}
              y={CY - R_INNER + 16}
              textAnchor="middle"
              className="fill-sky-600/40 dark:fill-sky-400/30 text-[9px] font-bold uppercase tracking-widest pointer-events-none"
            >
              {lang === 'bn' ? 'মা-বাবা ও স্বজন রিং' : 'Parents & Elders Ring'}
            </text>
            <text
              x={CX}
              y={CY - R_OUTER + 16}
              textAnchor="middle"
              className="fill-purple-600/40 dark:fill-purple-400/30 text-[9px] font-bold uppercase tracking-widest pointer-events-none"
            >
              {lang === 'bn' ? 'দাদা-দাদী ও কনিষ্ঠ প্রজন্ম রিং' : 'Grandparents & Descendants Ring'}
            </text>

            {/* Smooth Curved Connections from Self to Circular Nodes */}
            {circularNodes.map((cn) => {
              const isHovered = hoveredNodeId === cn.node.userId
              const isUrgent = cn.node.healthSummary?.hasUrgentCondition

              // Cubic Bezier curve control points
              const midX = (CX + cn.x) / 2
              const midY = (CY + cn.y) / 2
              const curveStrength = 0.15
              const dx = cn.x - CX
              const dy = cn.y - CY
              const cpX = midX - dy * curveStrength
              const cpY = midY + dx * curveStrength

              return (
                <g key={`conn-${cn.node.userId}`}>
                  <path
                    d={`M ${CX} ${CY} Q ${cpX} ${cpY} ${cn.x} ${cn.y}`}
                    fill="none"
                    stroke={isUrgent ? 'url(#urgentGlow)' : 'url(#orbitGlow)'}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    strokeDasharray={isUrgent ? 'none' : '3 3'}
                    className="transition-all duration-300"
                  />
                  {/* Energy Particle on Curve */}
                  <circle
                    cx={cpX}
                    cy={cpY}
                    r={isHovered ? 3.5 : 2}
                    fill={isUrgent ? '#f43f5e' : '#0ea5e9'}
                    className="animate-pulse"
                  />
                </g>
              )
            })}
          </svg>

          {/* ============================================================= */}
          {/* CENTER CIRCULAR NODE: SELF (YOU)                             */}
          {/* ============================================================= */}
          <motion.div
            style={{
              left: CX - 50,
              top: CY - 50,
              width: 100,
              height: 100,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => self && onSelectMember(self.userId)}
            className="absolute z-30 flex flex-col items-center justify-center cursor-pointer group"
          >
            {/* Center Outer Pulsing Halo */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-400 via-teal-400 to-emerald-400 opacity-25 blur-lg group-hover:opacity-45 animate-pulse transition-opacity" />
            <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-sky-400/40 animate-[spin_24s_linear_infinite]" />

            {/* Circular Glass Core */}
            <div className="relative w-20 h-20 rounded-full bg-white dark:bg-gray-900 border-2 border-sky-400 dark:border-sky-500 shadow-lg shadow-sky-500/20 p-1 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 flex flex-col items-center justify-center text-white text-center shadow-inner">
                <span className="text-xl font-black tracking-tight leading-none">
                  {self?.name?.[0]?.toUpperCase() || 'Y'}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5 opacity-90">
                  {lang === 'bn' ? 'আপনি' : 'YOU'}
                </span>
              </div>

              {/* Status Badge */}
              <div className="absolute -bottom-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                {lang === 'bn' ? 'মূল কেন্দ্র' : 'Center'}
              </div>
            </div>

            <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mt-2.5 text-center truncate max-w-[120px]">
              {self?.name || (lang === 'bn' ? 'আপনি' : 'You')}
            </p>
          </motion.div>

          {/* ============================================================= */}
          {/* ORBITING CIRCULAR FAMILY NODES                                */}
          {/* ============================================================= */}
          {circularNodes.map((cn, idx) => {
            const node = cn.node
            const health = node.healthSummary
            const isHovered = hoveredNodeId === node.userId
            const isUrgent = health?.hasUrgentCondition
            const medCount = health?.activeMedications?.length || 0

            // Custom or mapped relation styling
            const meta = RELATIONS_MAP[node.relation] || {
              badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
            }

            // Avatar Gradient Theme based on generation
            let avatarGradient = 'from-sky-400 to-cyan-500'
            if (cn.tier === 'grandparents') avatarGradient = 'from-purple-500 to-indigo-500'
            else if (cn.tier === 'parents') avatarGradient = 'from-sky-500 to-teal-500'
            else if (cn.tier === 'peers') avatarGradient = 'from-emerald-500 to-teal-500'
            else if (cn.tier === 'children') avatarGradient = 'from-amber-400 to-orange-500'
            else if (cn.tier === 'grandchildren') avatarGradient = 'from-pink-400 to-rose-500'

            return (
              <motion.div
                key={node.id}
                style={{
                  left: cn.x - 42,
                  top: cn.y - 42,
                  width: 84,
                  height: 84,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  damping: 22,
                  stiffness: 220,
                  delay: idx * 0.05,
                }}
                whileHover={{ scale: 1.12, zIndex: 40 }}
                onHoverStart={() => setHoveredNodeId(node.userId)}
                onHoverEnd={() => setHoveredNodeId(null)}
                onClick={() => onSelectMember(node.userId)}
                className="absolute z-20 flex flex-col items-center justify-center cursor-pointer group"
              >
                {/* Urgent Ring Halo */}
                {isUrgent && (
                  <div className="absolute inset-0 rounded-full bg-rose-500 opacity-30 blur-md animate-ping pointer-events-none" />
                )}

                {/* Circular Node Disk */}
                <div
                  className={`relative w-[72px] h-[72px] rounded-full p-1 transition-all duration-300 shadow-md ${
                    isUrgent
                      ? 'bg-rose-500/20 border-2 border-rose-500 shadow-rose-500/20'
                      : isHovered
                      ? 'bg-sky-500/20 border-2 border-sky-400 shadow-sky-500/30'
                      : 'bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 shadow-gray-200/50 dark:shadow-none hover:border-sky-400'
                  }`}
                >
                  {/* Inside Avatar Orb */}
                  <div
                    className={`w-full h-full rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-base font-black shadow-inner`}
                  >
                    {node.name?.[0]?.toUpperCase() || 'U'}
                  </div>

                  {/* Top-Right Medicine Micro-Badge */}
                  {medCount > 0 ? (
                    <div
                      className="absolute -top-1.5 -right-1.5 bg-white dark:bg-gray-800 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-700 rounded-full text-[9px] font-bold px-1.5 py-0.2 shadow-xs flex items-center gap-0.5"
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

                  {/* Urgent Alert Icon Flag */}
                  {isUrgent && (
                    <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-xs animate-bounce">
                      <AlertTriangle className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {/* Name & Relation Floating Label Pill */}
                <div className="mt-1 flex flex-col items-center pointer-events-none">
                  <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate max-w-[100px] text-center drop-shadow-xs group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {node.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0 rounded-md font-medium truncate max-w-[90px] border shadow-2xs ${meta.badgeColor}`}
                  >
                    {getRelationLabel(node.relation, lang)}
                  </Badge>
                </div>

                {/* Floating Rich Tooltip on Hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className="absolute bottom-full mb-3 p-3 rounded-2xl bg-gray-900/95 dark:bg-gray-800/95 text-white backdrop-blur-md shadow-xl border border-gray-700/60 w-48 text-left z-50 pointer-events-none"
                    >
                      <p className="text-xs font-bold truncate">{node.name}</p>
                      <p className="text-[10px] text-sky-400 font-mono">
                        {node.email || (node.username ? `@${node.username}` : getRelationLabel(node.relation, lang))}
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-300">
                        <span>{lang === 'bn' ? 'ওষুধ রুটিন:' : 'Medications:'}</span>
                        <span className="font-bold text-white">{medCount} {lang === 'bn' ? 'টি' : 'items'}</span>
                      </div>
                      <p className="text-[9px] text-gray-400 mt-1 text-center font-medium">
                        {lang === 'bn' ? 'ক্লিক করে রিপোর্ট দেখুন' : 'Click to inspect health panel'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {/* Empty State Prompt */}
          {!hasRelatives && (
            <div className="absolute inset-x-0 bottom-12 flex flex-col items-center justify-center text-center pointer-events-none">
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

      {/* Orbit Legend & Health Status Bar */}
      <div className="relative z-20 px-5 py-3 border-t border-gray-200/60 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md flex items-center justify-between gap-4 flex-wrap text-[11px] text-gray-500 dark:text-gray-400">
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
