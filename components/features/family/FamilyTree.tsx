'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Pill,
  AlertTriangle,
  Compass,
  GitFork,
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

type ViewMode = 'circular' | 'tree'

export function FamilyTree({ treeData, onSelectMember, onAddMember }: FamilyTreeProps) {
  const { lang } = useLanguage()
  const [viewMode, setViewMode] = useState<ViewMode>('circular')
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const self = treeData?.self
  const otherNodes = treeData?.otherNodes || treeData?.members || []
  const hasRelatives = otherNodes && otherNodes.length > 0

  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.4, z + 0.1))
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.65, z - 0.1))
  const handleResetZoom = () => setZoomLevel(1)

  // Sort tiers for structured rendering:
  const grandparents = treeData?.generations?.grandparents || otherNodes.filter((n) => n.generation === -2) || []
  const parents = treeData?.generations?.parents || otherNodes.filter((n) => n.generation === -1) || []
  const peers = (treeData?.generations?.peers || otherNodes.filter((n) => n.generation === 0) || []).filter((n) => !n.isCurrentUser)
  const children = treeData?.generations?.children || otherNodes.filter((n) => n.generation === 1) || []
  const grandchildren = treeData?.generations?.grandchildren || otherNodes.filter((n) => n.generation === 2) || []
  const totalMembers = treeData?.totalMembers ?? (otherNodes.length + (self ? 1 : 0))

  // =========================================================================
  // CIRCULAR ORBITAL POSITIONING ENGINE
  // =========================================================================
  const CANVAS_W = 920
  const CANVAS_H = 720
  const CX = CANVAS_W / 2
  const CY = CANVAS_H / 2

  const R_INNER = 190 // Orbit 1: Parents, Peers, Children
  const R_OUTER = 320 // Orbit 2: Grandparents, Grandchildren

  interface PlacedNode {
    node: FamilyTreeNode
    x: number
    y: number
    angle: number
    radius: number
    ring: 'inner' | 'outer'
  }

  const placedNodes: PlacedNode[] = []

  // Helper to place a slice of nodes along an angle arc
  const placeArc = (
    nodes: FamilyTreeNode[],
    startAngleDeg: number,
    endAngleDeg: number,
    radius: number,
    ring: 'inner' | 'outer'
  ) => {
    if (nodes.length === 0) return
    if (nodes.length === 1) {
      const midDeg = (startAngleDeg + endAngleDeg) / 2
      const rad = (midDeg * Math.PI) / 180
      placedNodes.push({
        node: nodes[0],
        x: CX + radius * Math.cos(rad),
        y: CY + radius * Math.sin(rad),
        angle: midDeg,
        radius,
        ring,
      })
      return
    }

    const step = (endAngleDeg - startAngleDeg) / (nodes.length - 1 || 1)
    nodes.forEach((node, i) => {
      const deg = startAngleDeg + step * i
      const rad = (deg * Math.PI) / 180
      placedNodes.push({
        node,
        x: CX + radius * Math.cos(rad),
        y: CY + radius * Math.sin(rad),
        angle: deg,
        radius,
        ring,
      })
    })
  }

  // 1. Grandparents along Outer Top Arc (-150° to -30°)
  placeArc(grandparents, -150, -30, R_OUTER, 'outer')

  // 2. Parents & Elders along Inner Top Arc (-155° to -25°)
  placeArc(parents, -155, -25, R_INNER, 'inner')

  // 3. Peers & Siblings along Inner Sides (-15° to 45° and 135° to 195°)
  if (peers.length > 0) {
    const half = Math.ceil(peers.length / 2)
    const leftPeers = peers.slice(0, half)
    const rightPeers = peers.slice(half)
    placeArc(leftPeers, 140, 190, R_INNER, 'inner')
    placeArc(rightPeers, -10, 40, R_INNER, 'inner')
  }

  // 4. Children along Inner Bottom Arc (55° to 125°)
  placeArc(children, 55, 125, R_INNER, 'inner')

  // 5. Grandchildren along Outer Bottom Arc (40° to 140°)
  placeArc(grandchildren, 40, 140, R_OUTER, 'outer')

  // Catch-all: If any member was not placed, distribute evenly around outer ring
  const placedIds = new Set(placedNodes.map((p) => p.node.userId))
  const remaining = otherNodes.filter((n) => !placedIds.has(n.userId))
  if (remaining.length > 0) {
    placeArc(remaining, 0, 360, R_OUTER, 'outer')
  }

  return (
    <div className="relative w-full rounded-3xl border border-gray-100 dark:border-gray-800 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 text-white shadow-xl overflow-hidden min-h-[640px] flex flex-col">
      {/* Dynamic Cosmic Constellation Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c70a_1px,transparent_1px),linear-gradient(to_bottom,#0284c70a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

      {/* Top Header & Interactive Floating Controls */}
      <div className="relative z-20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 backdrop-blur-md bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{lang === 'bn' ? 'ইন্টারেক্টিভ পারিবারিক অরবিট' : 'Family Health Orbit'}</span>
              <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2.5 py-0.5 rounded-full">
                {totalMembers} {lang === 'bn' ? 'সদস্য' : 'Members'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {lang === 'bn'
                ? 'বৃত্তাকার অরবিটে পরিবারের প্রতিটি সদস্যের স্বাস্থ্য ও ওষুধ এক নজরে পর্যবেক্ষণ করুন'
                : 'Interactive circular orbit tracking health & medication status in real-time'}
            </p>
          </div>
        </div>

        {/* Action & View Mode Toggles */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
          {/* View Switcher */}
          <div className="flex items-center bg-slate-800/80 rounded-xl border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('circular')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'circular'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>{lang === 'bn' ? 'সার্কুলার অরবিট' : 'Circular Orbit'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'tree'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitFork className="h-3.5 w-3.5" />
              <span>{lang === 'bn' ? 'প্রজন্ম বৃক্ষ' : 'Hierarchy Tree'}</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800/80 rounded-xl border border-white/10 p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] font-mono font-bold px-1.5 text-slate-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              title="Reset Zoom"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>

          <Button
            size="sm"
            onClick={onAddMember}
            className="h-8 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-bold text-xs shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>{lang === 'bn' ? 'সদস্য যোগ' : 'Add Member'}</span>
          </Button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full overflow-auto flex items-center justify-center p-4 min-h-[580px]"
      >
        <motion.div
          animate={{ scale: zoomLevel }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative origin-center select-none"
          style={{ width: CANVAS_W, height: CANVAS_H }}
        >
          {/* ============================================================= */}
          {/* VIEW 1: CIRCULAR ORBIT MODE                                   */}
          {/* ============================================================= */}
          {viewMode === 'circular' && (
            <div className="relative w-full h-full">
              {/* SVG Orbit Tracks & Laser Constellation Connecting Beams */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              >
                <defs>
                  {/* Glowing Laser Beam Gradients */}
                  <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="urgentBeamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.5" />
                  </linearGradient>

                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Orbit Rings (Concentric Generational Circles) */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R_INNER}
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.15)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <circle
                  cx={CX}
                  cy={CY}
                  r={R_OUTER}
                  fill="none"
                  stroke="rgba(168, 85, 247, 0.12)"
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                />

                {/* Orbit Zone Sector Labels */}
                <text
                  x={CX}
                  y={CY - R_OUTER + 18}
                  textAnchor="middle"
                  className="fill-purple-400/50 text-[10px] font-bold uppercase tracking-widest pointer-events-none"
                >
                  {lang === 'bn' ? '👴 দাদা-দাদী / নানা-নানী অরবিট (-২)' : '🧓 Grandparents Orbit (-2)'}
                </text>
                <text
                  x={CX}
                  y={CY - R_INNER + 18}
                  textAnchor="middle"
                  className="fill-sky-400/50 text-[9px] font-bold uppercase tracking-wider pointer-events-none"
                >
                  {lang === 'bn' ? '👨‍🦳 মা-বাবা ও জ্যেষ্ঠ অভিভাবক অরবিট (-১)' : '👨‍🦳 Parents & Elders Orbit (-1)'}
                </text>
                <text
                  x={CX}
                  y={CY + R_INNER - 10}
                  textAnchor="middle"
                  className="fill-emerald-400/50 text-[9px] font-bold uppercase tracking-wider pointer-events-none"
                >
                  {lang === 'bn' ? '👶 সন্তান ও কনিষ্ঠ প্রজন্ম অরবিট (+১)' : '👶 Children Orbit (+1)'}
                </text>

                {/* Connecting Constellation Laser Beams */}
                {placedNodes.map((pn) => {
                  const isHovered = hoveredNodeId === pn.node.userId
                  const isUrgent = pn.node.healthSummary?.hasUrgentCondition

                  return (
                    <g key={`beam-${pn.node.userId}`}>
                      <line
                        x1={CX}
                        y1={CY}
                        x2={pn.x}
                        y2={pn.y}
                        stroke={isUrgent ? 'url(#urgentBeamGradient)' : 'url(#beamGradient)'}
                        strokeWidth={isHovered ? 2.5 : 1.2}
                        strokeDasharray={isUrgent ? 'none' : '3 3'}
                        className="transition-all duration-300"
                        filter={isHovered ? 'url(#glow)' : undefined}
                      />
                      {/* Interactive Pulse Point */}
                      <circle
                        cx={(CX + pn.x) / 2}
                        cy={(CY + pn.y) / 2}
                        r={isHovered ? 3.5 : 2}
                        fill={isUrgent ? '#f43f5e' : '#38bdf8'}
                        className="animate-pulse"
                      />
                    </g>
                  )
                })}
              </svg>

              {/* ========================================================= */}
              {/* CENTER CORE: SELF (YOU)                                   */}
              {/* ========================================================= */}
              <div
                style={{
                  left: CX - 64,
                  top: CY - 64,
                  width: 128,
                  height: 128,
                }}
                className="absolute z-30 flex flex-col items-center justify-center cursor-pointer group"
                onClick={() => self && onSelectMember(self.userId)}
              >
                {/* Glowing Aura Rings */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 opacity-20 blur-xl group-hover:opacity-40 animate-pulse transition-opacity" />
                <div className="absolute -inset-2 rounded-full border-2 border-sky-400/30 border-dashed animate-[spin_20s_linear_infinite]" />

                {/* Core Avatar Card */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 p-1 shadow-xl shadow-sky-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center text-center p-1">
                    <span className="text-xl font-black text-white">
                      {self?.name?.[0]?.toUpperCase() || 'Y'}
                    </span>
                    <span className="text-[9px] font-bold text-sky-400 uppercase tracking-tight">
                      {lang === 'bn' ? 'আপনি' : 'YOU'}
                    </span>
                  </div>

                  {/* Core Pulse Badge */}
                  <div className="absolute -bottom-1.5 bg-sky-500 text-white text-[9px] font-bold px-2 py-0.2 rounded-full shadow-sm">
                    {lang === 'bn' ? 'মূল কেন্দ্র' : 'Core'}
                  </div>
                </div>

                <p className="text-xs font-bold text-white mt-3 text-center truncate max-w-[130px] drop-shadow-sm">
                  {self?.name || (lang === 'bn' ? 'আপনি (স্বয়ং)' : 'You')}
                </p>
              </div>

              {/* ========================================================= */}
              {/* ORBITING FAMILY MEMBER NODES                              */}
              {/* ========================================================= */}
              {placedNodes.map((pn) => {
                const node = pn.node
                const isHovered = hoveredNodeId === node.userId
                const health = node.healthSummary
                const isUrgent = health?.hasUrgentCondition
                const meta = RELATIONS_MAP[node.relation] || {
                  badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
                }
                const medCount = health?.activeMedications?.length || 0

                return (
                  <motion.div
                    key={node.id}
                    style={{
                      left: pn.x - 70,
                      top: pn.y - 40,
                      width: 140,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.08, zIndex: 40 }}
                    onHoverStart={() => setHoveredNodeId(node.userId)}
                    onHoverEnd={() => setHoveredNodeId(null)}
                    onClick={() => onSelectMember(node.userId)}
                    className="absolute z-20 cursor-pointer group"
                  >
                    {/* Node Glass Card */}
                    <div
                      className={`relative p-2.5 rounded-2xl backdrop-blur-md transition-all duration-300 border shadow-lg ${
                        isUrgent
                          ? 'bg-rose-950/70 border-rose-500/60 shadow-rose-950/50 hover:border-rose-400'
                          : isHovered
                          ? 'bg-slate-800/90 border-sky-400 shadow-sky-950/60'
                          : 'bg-slate-800/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Urgent Alert Banner Dot */}
                      {isUrgent && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white text-[9px] font-black animate-ping" />
                      )}

                      <div className="flex items-center gap-2">
                        {/* Avatar Badge */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm ${
                            isUrgent
                              ? 'bg-gradient-to-br from-rose-500 to-amber-500'
                              : 'bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-400'
                          }`}
                        >
                          {node.name?.[0]?.toUpperCase() || 'U'}
                        </div>

                        {/* Name & Relation */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                            {node.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 rounded-md font-medium truncate max-w-full ${meta.badgeColor}`}
                          >
                            {getRelationLabel(node.relation, lang)}
                          </Badge>
                        </div>
                      </div>

                      {/* Quick Health Stats Micro-bar */}
                      <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                        {medCount > 0 ? (
                          <span className="flex items-center gap-1 text-sky-300 font-mono">
                            <Pill className="h-3 w-3" />
                            {medCount} {lang === 'bn' ? 'ওষুধ' : 'meds'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-[9px]">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {lang === 'bn' ? 'স্বাভাবিক' : 'Normal'}
                          </span>
                        )}

                        {isUrgent ? (
                          <span className="flex items-center gap-0.5 text-rose-400 font-bold text-[9px]">
                            <AlertTriangle className="h-3 w-3" />
                            {lang === 'bn' ? 'সতর্কতা' : 'Alert'}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400">
                            {lang === 'bn' ? 'বিবরণ >' : 'View >'}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {/* Empty state overlay if only Self is present */}
              {!hasRelatives && (
                <div className="absolute inset-x-0 bottom-10 flex flex-col items-center justify-center text-center pointer-events-none">
                  <div className="p-4 rounded-2xl bg-slate-800/80 backdrop-blur-md border border-white/10 max-w-md pointer-events-auto">
                    <Sparkles className="h-6 w-6 text-sky-400 mx-auto mb-1.5" />
                    <h4 className="text-xs font-bold text-white">
                      {lang === 'bn' ? 'অরবিটে পরিবার যুক্ত করুন' : 'Your Family Orbit is Ready'}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {lang === 'bn'
                        ? 'মা-বাবা বা স্বজনদের জিমেইল দিয়ে আমন্ত্রণ পাঠিয়ে এই সার্কুলার ট্রিতে যুক্ত করুন।'
                        : 'Invite your parents, grandparents, or family members to view them in this orbit.'}
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
            </div>
          )}

          {/* ============================================================= */}
          {/* VIEW 2: TRADITIONAL GENERATIONAL HIERARCHY TREE VIEW         */}
          {/* ============================================================= */}
          {viewMode === 'tree' && (
            <div className="w-full h-full flex flex-col justify-between py-6 space-y-6">
              {/* Grandparents Tier (-2) */}
              {grandparents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 text-center">
                    {lang === 'bn' ? '🧓 দাদা-দাদী / নানা-নানী প্রজন্ম (-২)' : '🧓 Grandparents Generation (-2)'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {grandparents.map((node) => (
                      <TreeMemberCard
                        key={node.id}
                        node={node}
                        lang={lang}
                        onSelect={onSelectMember}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Parents Tier (-1) */}
              {parents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400 text-center">
                    {lang === 'bn' ? '👨‍🦳 মা-বাবা ও জ্যেষ্ঠ অভিভাবক প্রজন্ম (-১)' : '👨‍🦳 Parents & Elders Generation (-1)'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {parents.map((node) => (
                      <TreeMemberCard
                        key={node.id}
                        node={node}
                        lang={lang}
                        onSelect={onSelectMember}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Self & Peers Tier (0) */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 text-center">
                  {lang === 'bn' ? '🤝 আপনার প্রজন্ম ও সহোদর (০)' : '🤝 Current Generation & Peers (0)'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {/* Self Core Node */}
                  {self && (
                    <div
                      onClick={() => onSelectMember(self.userId)}
                      className="p-3 rounded-2xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 border-2 border-sky-400 cursor-pointer shadow-lg shadow-sky-500/20 min-w-[160px] text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-sky-500 text-white font-black text-sm flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                        {self.name?.[0]?.toUpperCase() || 'Y'}
                      </div>
                      <p className="text-xs font-bold text-white">{self.name || 'You'}</p>
                      <Badge className="text-[9px] bg-sky-500 text-white mt-1">
                        {lang === 'bn' ? 'আপনি (কেন্দ্র)' : 'You (Self)'}
                      </Badge>
                    </div>
                  )}

                  {peers.map((node) => (
                    <TreeMemberCard
                      key={node.id}
                      node={node}
                      lang={lang}
                      onSelect={onSelectMember}
                    />
                  ))}
                </div>
              </div>

              {/* Children Tier (+1) */}
              {children.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 text-center">
                    {lang === 'bn' ? '👶 সন্তান ও কনিষ্ঠ প্রজন্ম (+১)' : '👶 Children Generation (+1)'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {children.map((node) => (
                      <TreeMemberCard
                        key={node.id}
                        node={node}
                        lang={lang}
                        onSelect={onSelectMember}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Grandchildren Tier (+2) */}
              {grandchildren.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-pink-400 text-center">
                    {lang === 'bn' ? '🍼 নাতি-নাতনি প্রজন্ম (+২)' : '🍼 Grandchildren Generation (+2)'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {grandchildren.map((node) => (
                      <TreeMemberCard
                        key={node.id}
                        node={node}
                        lang={lang}
                        onSelect={onSelectMember}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Orbit Legend & Health Status Bar */}
      <div className="relative z-20 px-5 py-3 border-t border-white/10 bg-slate-900/60 backdrop-blur-md flex items-center justify-between gap-4 flex-wrap text-[11px] text-slate-400">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-white">{lang === 'bn' ? 'লেজেন্ড:' : 'Legend:'}</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span>{lang === 'bn' ? 'দাদা-দাদী (-২)' : 'Grandparents'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>{lang === 'bn' ? 'মা-বাবা (-১)' : 'Parents & Elders'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>{lang === 'bn' ? 'সহোদর / সমবয়সী (০)' : 'Peers'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>{lang === 'bn' ? 'সন্তান (+১)' : 'Children'}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>{lang === 'bn' ? 'সব রিপোর্ট নিরাপদ' : 'All Clear'}</span>
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <AlertTriangle className="h-3 w-3" />
            <span>{lang === 'bn' ? 'জরুরি দৃষ্টি প্রয়োজন' : 'Needs Attention'}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

function TreeMemberCard({
  node,
  lang,
  onSelect,
}: {
  node: FamilyTreeNode
  lang: 'en' | 'bn'
  onSelect: (id: string) => void
}) {
  const health = node.healthSummary
  const isUrgent = health?.hasUrgentCondition
  const meta = RELATIONS_MAP[node.relation] || {
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
  }
  const medCount = health?.activeMedications?.length || 0

  return (
    <div
      onClick={() => onSelect(node.userId)}
      className={`p-3 rounded-2xl bg-slate-800/80 border transition-all cursor-pointer hover:scale-105 min-w-[150px] ${
        isUrgent
          ? 'border-rose-500/80 shadow-rose-950/50'
          : 'border-white/10 hover:border-sky-400 shadow-slate-950/40'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold ${
            isUrgent ? 'bg-rose-500' : 'bg-sky-500'
          }`}
        >
          {node.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{node.name}</p>
          <Badge variant="outline" className={`text-[8px] px-1 py-0 rounded ${meta.badgeColor}`}>
            {getRelationLabel(node.relation, lang)}
          </Badge>
        </div>
      </div>
      <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-300">
        <span className="flex items-center gap-1 text-sky-300 font-mono">
          <Pill className="h-2.5 w-2.5" />
          {medCount} {lang === 'bn' ? 'ওষুধ' : 'meds'}
        </span>
        <span className="text-slate-400">{lang === 'bn' ? 'দেখুন >' : 'View >'}</span>
      </div>
    </div>
  )
}
