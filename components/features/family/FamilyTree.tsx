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

interface CircularMemberNode {
  node: FamilyTreeNode
  x: number
  y: number
  radius: number
  angleDeg: number
  gradient: string
  borderColor: string
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
  // RESPONSIVE CALCULATION (PERFECT CIRCLES & BALANCED ARCS)
  // =========================================================================
  const { width, height } = dimensions
  const cx = width / 2
  const cy = height / 2

  const minDim = Math.min(width, height)
  const scale = Math.max(0.8, Math.min(1.2, minDim / 660))

  // True circular sizes (Diameter in px)
  const orbSize = Math.round(Math.max(90, Math.min(124, 108 * scale)))
  const selfOrbSize = Math.round(Math.max(110, Math.min(148, 132 * scale)))

  // Concentric Orbit Radii
  const rInner = Math.round(Math.max(145, Math.min(220, minDim * 0.3)))
  const rOuter = Math.round(Math.max(220, Math.min(335, minDim * 0.45)))

  const totalMembers = treeData?.totalMembers ?? (otherNodes.length + (self ? 1 : 0))

  // Calculate circular coordinates with symmetric non-overlapping distribution
  const circularNodes = useMemo(() => {
    const list: CircularMemberNode[] = []
    if (otherNodes.length === 0) return list

    // Theme assigner by generation
    const getTheme = (node: FamilyTreeNode) => {
      const gen = node.generation
      if (gen === -2) {
        return {
          gradient: 'from-purple-500 via-indigo-500 to-purple-600',
          borderColor: 'border-purple-400 dark:border-purple-500',
          ringCategory: lang === 'bn' ? 'দাদা-দাদী' : 'Grandparents',
        }
      }
      if (gen === -1) {
        return {
          gradient: 'from-sky-500 via-cyan-500 to-teal-500',
          borderColor: 'border-sky-400 dark:border-sky-500',
          ringCategory: lang === 'bn' ? 'মা-বাবা' : 'Parents & Elders',
        }
      }
      if (gen === 0) {
        return {
          gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
          borderColor: 'border-emerald-400 dark:border-emerald-500',
          ringCategory: lang === 'bn' ? 'সহোদর / সমবয়সী' : 'Peers',
        }
      }
      if (gen === 1) {
        return {
          gradient: 'from-amber-400 via-orange-500 to-amber-500',
          borderColor: 'border-amber-400 dark:border-amber-500',
          ringCategory: lang === 'bn' ? 'সন্তান' : 'Children',
        }
      }
      return {
        gradient: 'from-pink-400 via-rose-500 to-pink-500',
        borderColor: 'border-pink-400 dark:border-pink-500',
        ringCategory: lang === 'bn' ? 'নাতি-নাতনি' : 'Grandchildren',
      }
    }

    const grandparents = otherNodes.filter((n) => n.generation === -2)
    const parents = otherNodes.filter((n) => n.generation === -1)
    const peers = otherNodes.filter((n) => n.generation === 0)
    const children = otherNodes.filter((n) => n.generation === 1)
    const grandchildren = otherNodes.filter((n) => n.generation === 2)

    // Helper to distribute items along an angular arc
    const distributeArc = (
      items: FamilyTreeNode[],
      radius: number,
      startAngle: number,
      endAngle: number,
      singleAngleOffset: number
    ) => {
      if (items.length === 0) return
      if (items.length === 1) {
        const angle = singleAngleOffset
        const rad = (angle * Math.PI) / 180
        const theme = getTheme(items[0])
        list.push({
          node: items[0],
          x: cx + radius * Math.cos(rad),
          y: cy + radius * Math.sin(rad),
          radius,
          angleDeg: angle,
          ...theme,
        })
        return
      }

      const step = (endAngle - startAngle) / (items.length - 1)
      items.forEach((item, idx) => {
        const angle = startAngle + step * idx
        const rad = (angle * Math.PI) / 180
        const theme = getTheme(item)
        list.push({
          node: item,
          x: cx + radius * Math.cos(rad),
          y: cy + radius * Math.sin(rad),
          radius,
          angleDeg: angle,
          ...theme,
        })
      })
    }

    // 1. Grandparents (Outer Top Arc: -150° to -30°, single placed at -60°)
    distributeArc(grandparents, rOuter, -150, -30, -55)

    // 2. Parents & Elders (Inner Top Arc: -155° to -25°, single placed at -125°)
    distributeArc(parents, rInner, -155, -25, -125)

    // 3. Peers & Siblings (Inner Sides: Left 145° to 195°, Right -15° to 35°)
    if (peers.length > 0) {
      const leftPeers = peers.slice(0, Math.ceil(peers.length / 2))
      const rightPeers = peers.slice(Math.ceil(peers.length / 2))

      distributeArc(leftPeers, rInner, 145, 195, 170)
      distributeArc(rightPeers, rInner, -15, 35, 10)
    }

    // 4. Children (Inner Bottom Arc: 45° to 135°, single placed at 70°)
    distributeArc(children, rInner, 45, 135, 70)

    // 5. Grandchildren (Outer Bottom Arc: 35° to 145°, single placed at 115°)
    distributeArc(grandchildren, rOuter, 35, 145, 115)

    // Catch-all unplaced
    const placed = new Set(list.map((n) => n.node.userId))
    const unplaced = otherNodes.filter((n) => !placed.has(n.userId))
    if (unplaced.length > 0) {
      distributeArc(unplaced, rOuter, 0, 360, 0)
    }

    return list
  }, [otherNodes, cx, cy, rInner, rOuter, lang])

  return (
    <div className="relative w-full rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-gradient-to-b from-white via-sky-50/20 to-slate-50/50 dark:from-gray-950 dark:via-gray-900/90 dark:to-gray-950 shadow-xs overflow-hidden flex flex-col transition-all">
      {/* Subtle Dot Mesh Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#0284c710_1px,transparent_1px)] [background-size:22px_22px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] bg-sky-400/5 dark:bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Controls Bar */}
      <div className="relative z-20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200/60 dark:border-gray-800/80 backdrop-blur-md bg-white/75 dark:bg-gray-900/75">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-500/15 shrink-0">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                {lang === 'bn' ? 'পারিবারিক বৃত্তাকার নেটওয়ার্ক' : 'Family Health Circle'}
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 rounded-full px-2 py-0.5">
                {totalMembers} {lang === 'bn' ? 'সদস্য' : 'Members'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lang === 'bn'
                ? 'পরিবারের প্রতিটি বৃত্তাকার সদস্যে ক্লিক করে ওষুধের রুটিন ও স্বাস্থ্য পর্যবেক্ষণ করুন'
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
          {/* Subtle Clean Orbit Circles (No Text, No Lines!) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`}>
            {/* Inner Generation Ring */}
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

            {/* Outer Generation Ring */}
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
          </svg>

          {/* ============================================================= */}
          {/* CENTER 100% PURE ROUND CIRCULAR NODE: SELF (YOU)             */}
          {/* ============================================================= */}
          <motion.div
            style={{
              left: cx - selfOrbSize / 2,
              top: cy - selfOrbSize / 2,
              width: selfOrbSize,
              height: selfOrbSize,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => self && onSelectMember(self.userId)}
            className="absolute z-30 cursor-pointer group flex items-center justify-center"
          >
            {/* Glowing Pulse Aura */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-400 via-teal-400 to-emerald-400 opacity-25 blur-lg group-hover:opacity-45 animate-pulse transition-opacity pointer-events-none" />
            <div className="absolute -inset-1 rounded-full border-2 border-dashed border-sky-400/40 animate-[spin_24s_linear_infinite] pointer-events-none" />

            {/* Perfect Round Circle Card */}
            <div className="relative w-full h-full rounded-full bg-white/95 dark:bg-gray-900/95 border-2 border-sky-400 dark:border-sky-500 shadow-xl shadow-sky-500/15 p-2 flex flex-col items-center justify-center text-center overflow-hidden">
              {/* Inner Avatar Ring */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 flex items-center justify-center text-white text-base sm:text-lg font-black shadow-inner shrink-0">
                {self?.name?.[0]?.toUpperCase() || 'Y'}
              </div>

              {/* Name & Core Role directly INSIDE circle */}
              <p className="text-[11px] sm:text-xs font-bold text-gray-900 dark:text-gray-100 truncate w-full px-1.5 mt-1 leading-tight">
                {self?.name || (lang === 'bn' ? 'আপনি' : 'You')}
              </p>
              <span className="text-[8px] sm:text-[9px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-tight">
                {lang === 'bn' ? 'মূল কেন্দ্র' : 'Center Core'}
              </span>
            </div>
          </motion.div>

          {/* ============================================================= */}
          {/* ORBITING 100% PURE ROUND CIRCULAR FAMILY NODES                */}
          {/* ============================================================= */}
          {circularNodes.map((cn, idx) => {
            const node = cn.node
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
                  left: cn.x - orbSize / 2,
                  top: cn.y - orbSize / 2,
                  width: orbSize,
                  height: orbSize,
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
                whileHover={{ scale: 1.12, zIndex: 40 }}
                onHoverStart={() => setHoveredNodeId(node.userId)}
                onHoverEnd={() => setHoveredNodeId(null)}
                onClick={() => onSelectMember(node.userId)}
                className="absolute z-20 cursor-pointer group flex items-center justify-center"
              >
                {/* Urgent Ring Halo */}
                {isUrgent && (
                  <div className="absolute inset-0 rounded-full bg-rose-500 opacity-35 blur-md animate-ping pointer-events-none" />
                )}

                {/* 100% PERFECT ROUND CIRCULAR ORB */}
                <div
                  className={`relative w-full h-full rounded-full p-2 flex flex-col items-center justify-center text-center transition-all duration-300 shadow-lg overflow-hidden ${
                    isUrgent
                      ? 'bg-rose-500/10 dark:bg-rose-950/40 border-2 border-rose-500 shadow-rose-500/20'
                      : isHovered
                      ? 'bg-sky-500/10 dark:bg-sky-950/40 border-2 border-sky-400 shadow-sky-500/30'
                      : 'bg-white/95 dark:bg-gray-900/95 border-2 ' + cn.borderColor + ' shadow-gray-200/60 dark:shadow-none hover:border-sky-400'
                  }`}
                >
                  {/* Inside Avatar Circle */}
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br ${cn.gradient} flex items-center justify-center text-white text-sm sm:text-base font-black shadow-inner shrink-0`}
                  >
                    {node.name?.[0]?.toUpperCase() || 'U'}
                  </div>

                  {/* Name inside round circle */}
                  <p className="text-[10px] sm:text-[11px] font-bold text-gray-900 dark:text-gray-100 truncate w-full px-1 mt-1 leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {node.name}
                  </p>

                  {/* Relation label inside round circle */}
                  <span className="text-[8px] sm:text-[9px] font-semibold text-gray-500 dark:text-gray-400 truncate w-full px-1">
                    {getRelationLabel(node.relation, lang)}
                  </span>

                  {/* Top-Right Medicine Pill Badge */}
                  {medCount > 0 ? (
                    <div
                      className="absolute top-1 right-1 bg-white dark:bg-gray-800 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-700 rounded-full text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 shadow-xs flex items-center gap-0.5"
                      title={`${medCount} active medications`}
                    >
                      <Pill className="h-2 w-2" />
                      <span>{medCount}</span>
                    </div>
                  ) : (
                    <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    </div>
                  )}

                  {/* Urgent Warning Flag */}
                  {isUrgent && (
                    <div className="absolute bottom-1 right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-xs animate-bounce">
                      <AlertTriangle className="h-2.5 w-2.5" />
                    </div>
                  )}
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
