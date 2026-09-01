'use client'

import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Sparkles,
  Pill,
  AlertTriangle,
  HeartPulse,
  CheckCircle2,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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

interface GenerationRow {
  level: number
  label: string
  labelBn: string
  nodes: FamilyTreeNode[]
  gradient: string
  connectorColor: string
  isSelf?: boolean
}

export function FamilyTree({ treeData, onSelectMember, onAddMember }: FamilyTreeProps) {
  const { lang } = useLanguage()
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const self = treeData?.self
  const otherNodes = useMemo(() => treeData?.otherNodes || treeData?.members || [], [treeData])
  const totalMembers = treeData?.totalMembers ?? (otherNodes.length + (self ? 1 : 0))

  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.4, z + 0.1))
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.65, z - 0.1))
  const handleResetZoom = () => setZoomLevel(1)

  // =========================================================================
  // MULTI-GENERATIONAL HIERARCHY TREE — Grouped by generation level
  // =========================================================================
  const generationRows = useMemo<GenerationRow[]>(() => {
    const rows: GenerationRow[] = []

    // Generation -2: Grandparents
    const grandparents = otherNodes.filter((n) => n.generation === -2)
    if (grandparents.length > 0) {
      rows.push({
        level: -2,
        label: 'Grandparents & Great Elders',
        labelBn: 'দাদা-দাদী / নানা-নানী প্রজন্ম',
        nodes: grandparents,
        gradient: 'from-purple-500 via-indigo-500 to-purple-600',
        connectorColor: 'bg-purple-300 dark:bg-purple-600',
      })
    }

    // Generation -1: Parents, Elders
    const parents = otherNodes.filter((n) => n.generation === -1)
    if (parents.length > 0) {
      rows.push({
        level: -1,
        label: 'Parents & Elders',
        labelBn: 'মা-বাবা ও জ্যেষ্ঠ অভিভাবক',
        nodes: parents,
        gradient: 'from-sky-500 via-cyan-500 to-teal-500',
        connectorColor: 'bg-sky-300 dark:bg-sky-600',
      })
    }

    // Generation 0: Self + Peers (siblings, spouse, cousins)
    const peers = otherNodes.filter((n) => n.generation === 0)
    rows.push({
      level: 0,
      label: 'Your Generation',
      labelBn: 'আপনার প্রজন্ম ও সহোদর',
      nodes: peers,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      connectorColor: 'bg-emerald-300 dark:bg-emerald-600',
      isSelf: true,
    })

    // Generation +1: Children
    const children = otherNodes.filter((n) => n.generation === 1)
    if (children.length > 0) {
      rows.push({
        level: 1,
        label: 'Children & Descendants',
        labelBn: 'সন্তান ও কনিষ্ঠ প্রজন্ম',
        nodes: children,
        gradient: 'from-amber-400 via-orange-500 to-amber-500',
        connectorColor: 'bg-amber-300 dark:bg-amber-600',
      })
    }

    // Generation +2: Grandchildren
    const grandchildren = otherNodes.filter((n) => n.generation === 2)
    if (grandchildren.length > 0) {
      rows.push({
        level: 2,
        label: 'Grandchildren',
        labelBn: 'নাতি-নাতনি প্রজন্ম',
        nodes: grandchildren,
        gradient: 'from-pink-400 via-rose-500 to-pink-500',
        connectorColor: 'bg-pink-300 dark:bg-pink-600',
      })
    }

    return rows
  }, [otherNodes])

  const hasFamily = generationRows.some((r) => r.nodes.length > 0 || r.isSelf)

  // Reusable member node component
  const renderMemberNode = (node: FamilyTreeNode, nodeIdx: number, rowIndex: number, gradient: string) => {
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
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 200,
          delay: rowIndex * 0.08 + nodeIdx * 0.05,
        }}
        whileHover={{ scale: 1.1, zIndex: 40 }}
        onHoverStart={() => setHoveredNodeId(node.userId)}
        onHoverEnd={() => setHoveredNodeId(null)}
        onClick={() => onSelectMember(node.userId)}
        className="flex flex-col items-center gap-2 cursor-pointer group relative shrink-0"
      >
        {/* Circular Avatar Node */}
        <div className="relative">
          {/* Urgent Ping */}
          {isUrgent && (
            <div className="absolute inset-0 rounded-full bg-rose-500 opacity-35 blur-md animate-ping pointer-events-none" />
          )}

          {/* Pure Circular Gradient Node */}
          <div
            className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center text-white text-center shadow-lg transition-all duration-300 ${
              isUrgent ? 'shadow-rose-500/30' : 'shadow-gray-400/20 dark:shadow-none'
            } ${isHovered ? 'shadow-sky-500/30 ring-2 ring-sky-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}`}
          >
            <span className="text-xl font-black leading-none">{node.name?.[0]?.toUpperCase() || 'U'}</span>
            <span className="text-[9px] font-semibold mt-0.5 opacity-90 truncate px-1 max-w-full">
              {getRelationLabel(node.relation, lang)}
            </span>
          </div>

          {/* Medicine Badge */}
          {medCount > 0 ? (
            <div
              className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-700 rounded-full text-[8px] font-bold px-1.5 py-0.5 shadow-xs flex items-center gap-0.5"
              title={`${medCount} active medications`}
            >
              <Pill className="h-2 w-2" />
              <span>{medCount}</span>
            </div>
          ) : (
            <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
              <CheckCircle2 className="h-2.5 w-2.5" />
            </div>
          )}

          {/* Urgent Badge */}
          {isUrgent && (
            <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-xs animate-bounce">
              <AlertTriangle className="h-2.5 w-2.5" />
            </div>
          )}
        </div>

        {/* Name Below Node */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100 truncate max-w-[100px] text-center group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            {node.name}
          </span>
        </div>

        {/* Rich Tooltip on Hover */}
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
  }

  return (
    <div className="relative w-full rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-gradient-to-b from-white via-sky-50/20 to-slate-50/50 dark:from-gray-950 dark:via-gray-900/90 dark:to-gray-950 shadow-xs overflow-hidden flex flex-col transition-all">
      {/* Subtle Dot Mesh Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#0284c710_1px,transparent_1px)] [background-size:22px_22px] pointer-events-none" />

      {/* Top Header Controls Bar */}
      <div className="relative z-20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200/60 dark:border-gray-800/80 backdrop-blur-md bg-white/75 dark:bg-gray-900/75">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-500/15 shrink-0">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                {lang === 'bn' ? 'পারিবারিক প্রজন্ম বৃক্ষ' : 'Family Generation Tree'}
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 rounded-full px-2 py-0.5">
                {totalMembers} {lang === 'bn' ? 'সদস্য' : 'Members'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lang === 'bn'
                ? 'প্রতিটি প্রজন্মের বৃত্তে ক্লিক করে ওষুধের রুটিন ও স্বাস্থ্য রিপোর্ট দেখুন'
                : 'Click on any generation node to monitor medication schedules & health reports'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-0.5 shadow-xs">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-7 w-7 p-0 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100" title="Zoom Out">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] font-mono font-bold px-1.5 text-gray-400">{Math.round(zoomLevel * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-7 w-7 p-0 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100" title="Zoom In">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetZoom} className="h-7 w-7 p-0 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100" title="Reset">
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

      {/* Main Generational Tree Stage */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full overflow-x-auto flex items-start justify-center py-8 px-4 min-h-[500px]"
      >
        <motion.div
          animate={{ scale: zoomLevel }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="relative origin-top w-full flex flex-col items-center gap-0 min-w-[340px]"
        >
          {/* Empty State */}
          {!hasFamily && (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
              <div className="p-4 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-800 max-w-sm shadow-lg">
                <Sparkles className="h-6 w-6 text-sky-500 mx-auto mb-1.5" />
                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {lang === 'bn' ? 'আপনার পারিবারিক বৃক্ষ তৈরি করুন' : 'Start Your Family Tree'}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {lang === 'bn'
                    ? 'মা-বাবা বা স্বজনদের জিমেইল দিয়ে আমন্ত্রণ পাঠিয়ে এই বৃক্ষে যুক্ত করুন।'
                    : 'Invite parents or family members via Gmail or username to start the tree.'}
                </p>
                <Button size="sm" onClick={onAddMember} className="mt-2.5 h-7 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold">
                  <Plus className="h-3 w-3 mr-1" />
                  <span>{lang === 'bn' ? 'প্রথম সদস্য যুক্ত করুন' : 'Add First Member'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Render Generational Rows */}
          {generationRows.map((row, rowIndex) => {
            const showConnector = rowIndex > 0

            // Symmetrically partition generation 0 peers around Self
            const leftPeers = row.isSelf ? row.nodes.filter((_, i) => i % 2 === 1) : []
            const rightPeers = row.isSelf ? row.nodes.filter((_, i) => i % 2 === 0) : []

            return (
              <div key={`row-${row.level}`} className="flex flex-col items-center w-full">
                {/* Vertical Connector Between Rows */}
                {showConnector && (
                  <motion.div
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: rowIndex * 0.1 }}
                    className="flex flex-col items-center gap-0.5 py-1"
                  >
                    <div className={`w-0.5 h-6 ${row.connectorColor} opacity-60`} />
                    <ChevronDown className={`h-4 w-4 ${row.level === 0 ? 'text-emerald-500' : row.level < 0 ? 'text-sky-400' : 'text-amber-500'} opacity-60`} />
                    <div className={`w-0.5 h-3 ${row.connectorColor} opacity-60`} />
                  </motion.div>
                )}

                {/* Generation Row Label */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rowIndex * 0.08 }}
                  className="mb-4 flex items-center gap-2"
                >
                  <div className={`h-px flex-1 min-w-[30px] bg-gradient-to-r from-transparent ${row.level < 0 ? 'to-sky-200 dark:to-sky-800' : row.level === 0 ? 'to-emerald-200 dark:to-emerald-800' : 'to-amber-200 dark:to-amber-800'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border backdrop-blur-sm ${
                    row.level === -2
                      ? 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800'
                      : row.level === -1
                      ? 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800'
                      : row.level === 0
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
                      : row.level === 1
                      ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
                      : 'text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/50 border-pink-200 dark:border-pink-800'
                  }`}>
                    {lang === 'bn' ? row.labelBn : row.label}
                  </span>
                  <div className={`h-px flex-1 min-w-[30px] bg-gradient-to-l from-transparent ${row.level < 0 ? 'to-sky-200 dark:to-sky-800' : row.level === 0 ? 'to-emerald-200 dark:to-emerald-800' : 'to-amber-200 dark:to-amber-800'}`} />
                </motion.div>

                {/* Nodes in this Generation Row */}
                {row.isSelf && self ? (
                  /* Generation 0: 3-column layout guaranteeing Self is ALWAYS perfectly centered! */
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 w-full max-w-2xl">
                    {/* Left Peers (Siblings/Spouse) */}
                    <div className="flex flex-wrap items-center justify-end gap-6">
                      {leftPeers.map((node, nodeIdx) =>
                        renderMemberNode(node, nodeIdx, rowIndex, row.gradient)
                      )}
                    </div>

                    {/* Self Circular Node — Centered Exactly on the Tree Centerline */}
                    <div className="flex justify-center shrink-0">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 18, stiffness: 200, delay: rowIndex * 0.08 }}
                        whileHover={{ scale: 1.08 }}
                        onClick={() => onSelectMember(self.userId)}
                        className="flex flex-col items-center gap-2 cursor-pointer group"
                      >
                        <div className="relative">
                          {/* Pulsing Aura */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-400 via-teal-400 to-emerald-400 opacity-20 blur-lg group-hover:opacity-40 animate-pulse transition-opacity" />
                          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 flex flex-col items-center justify-center text-white text-center shadow-xl shadow-sky-500/25 ring-4 ring-white dark:ring-gray-900">
                            <span className="text-2xl font-black leading-none">{self.name?.[0]?.toUpperCase() || 'Y'}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5 opacity-90">
                              {lang === 'bn' ? 'আপনি' : 'YOU'}
                            </span>
                          </div>
                          {/* Center Core Badge */}
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                            {lang === 'bn' ? 'মূল কেন্দ্র' : 'Center'}
                          </div>
                        </div>
                        <div className="flex flex-col items-center mt-1">
                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate max-w-[110px] text-center">
                            {self.name || (lang === 'bn' ? 'আপনি' : 'You')}
                          </span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Right Peers (Siblings/Spouse) */}
                    <div className="flex flex-wrap items-center justify-start gap-6">
                      {rightPeers.map((node, nodeIdx) =>
                        renderMemberNode(node, nodeIdx, rowIndex, row.gradient)
                      )}
                    </div>
                  </div>
                ) : (
                  /* Other Generational Rows (Grandparents, Parents, Children) */
                  <div className="flex flex-row flex-wrap items-center justify-center gap-6 w-full">
                    {row.nodes.map((node, nodeIdx) =>
                      renderMemberNode(node, nodeIdx, rowIndex, row.gradient)
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </motion.div>
      </div>

      {/* Status Legend Bar */}
      <div className="relative z-20 px-5 py-3 border-t border-gray-200/60 dark:border-gray-800 bg-white/75 dark:bg-gray-900/75 backdrop-blur-md flex items-center justify-between gap-4 flex-wrap text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-gray-800 dark:text-gray-200">{lang === 'bn' ? 'প্রজন্ম:' : 'Generations:'}</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>{lang === 'bn' ? 'দাদা-দাদী (-২)' : 'Grandparents'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>{lang === 'bn' ? 'মা-বাবা (-১)' : 'Parents'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{lang === 'bn' ? 'আপনার প্রজন্ম (০)' : 'Your Gen'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>{lang === 'bn' ? 'সন্তান (+১)' : 'Children'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            <span>{lang === 'bn' ? 'নাতি-নাতনি (+২)' : 'Grandchildren'}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            <span>{lang === 'bn' ? 'স্বাভাবিক' : 'Normal'}</span>
          </span>
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
            <AlertTriangle className="h-3 w-3" />
            <span>{lang === 'bn' ? 'সতর্কতা' : 'Alert'}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
