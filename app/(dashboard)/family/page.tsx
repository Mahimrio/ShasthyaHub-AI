'use client'

import { useState } from 'react'
import {
  Users,
  UserPlus,
  HeartPulse,
  TreeDeciduous,
  Inbox,
  Loader2,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import {
  useFamilyConnections,
  useFamilyTree,
  useProfileUsername,
} from '@/hooks/useFamily'
import { SetUsername } from '@/components/features/family/SetUsername'
import { FamilyTree } from '@/components/features/family/FamilyTree'
import { FamilyMemberCard } from '@/components/features/family/FamilyMemberCard'
import { InvitationCard } from '@/components/features/family/InvitationCard'
import { AddFamilyMember } from '@/components/features/family/AddFamilyMember'
import { MemberHealthPanel } from '@/components/features/family/MemberHealthPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function FamilyPage() {
  const { lang } = useLanguage()
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'tree' | 'members' | 'invitations'>('tree')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  const { data: usernameData } = useProfileUsername()
  const { data: connections, isLoading: isConnsLoading } = useFamilyConnections()
  const { data: treeData, isLoading: isTreeLoading } = useFamilyTree()

  const currentUsername = usernameData?.username || profile?.username || null
  const pendingReceived = (connections || []).filter((c) => c.status === 'pending' && !c.is_requester)
  const pendingSent = (connections || []).filter((c) => c.status === 'pending' && c.is_requester)
  const acceptedMembers = (connections || []).filter((c) => c.status === 'accepted')
  const totalPending = pendingReceived.length + pendingSent.length

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header with Glowing Health Aura */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-emerald-500/10 dark:from-sky-950/40 dark:via-cyan-950/20 dark:to-emerald-950/20 border border-sky-500/20 dark:border-sky-400/20 shadow-xs overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 shrink-0">
              <TreeDeciduous className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                  {lang === 'bn' ? 'পরিবার স্বাস্থ্য কেন্দ্র' : 'Family Health System'}
                </h1>
                <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {lang === 'bn' ? 'পারিবারিক কেয়ার' : 'Elder Care'}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-2xl">
                {lang === 'bn'
                  ? 'বয়স্ক পিতামাতা ও পরিবারের সদস্যদের যুক্ত করুন — তাঁদের প্রতিদিনের ওষুধ খাওয়ার রুটিন ও স্বাস্থ্য পরীক্ষা এক নজরে পর্যবেক্ষণ করুন।'
                  : 'Connect your elderly parents and family members to track their daily medication schedules, eye screenings, and diagnostic records in real-time.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              onClick={() => setAddModalOpen(true)}
              className="rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-xs font-bold h-10 px-4 shadow-md shadow-sky-500/20"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              <span>{lang === 'bn' ? 'নতুন সদস্য যুক্ত করুন' : 'Add Family Member'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Username & Family ID Banner */}
      <SetUsername
        currentUsername={currentUsername}
        userName={profile?.name || null}
        userEmail={user?.email || null}
      />

      {/* Quick Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 dark:text-gray-100">
              {acceptedMembers.length + 1}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lang === 'bn' ? 'সংযুক্ত সদস্য' : 'Family Members'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 dark:text-gray-100">
              {treeData ? treeData.totalMembers : 1}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lang === 'bn' ? 'ফ্যামিলি ট্রি নোড' : 'Tree Tree Nodes'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 dark:text-gray-100">
              {totalPending}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lang === 'bn' ? 'অপেক্ষমান আমন্ত্রণ' : 'Pending Invitations'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'tree' | 'members' | 'invitations')} className="space-y-4">
        <TabsList className="grid grid-cols-3 h-12 p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl max-w-md">
          <TabsTrigger value="tree" className="text-xs font-bold rounded-xl flex items-center gap-1.5">
            <TreeDeciduous className="h-4 w-4" />
            <span>{lang === 'bn' ? 'ফ্যামিলি ট্রি' : 'Family Tree'}</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="text-xs font-bold rounded-xl flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{lang === 'bn' ? 'সদস্যগণ' : 'Members'}</span>
            <span className="text-[10px] font-mono bg-white dark:bg-gray-700 px-1.5 py-0.2 rounded-full">
              {acceptedMembers.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="text-xs font-bold rounded-xl flex items-center gap-1.5">
            <Inbox className="h-4 w-4" />
            <span>{lang === 'bn' ? 'আমন্ত্রণ' : 'Requests'}</span>
            {totalPending > 0 && (
              <span className="text-[10px] font-mono bg-sky-500 text-white px-1.5 py-0.2 rounded-full">
                {totalPending}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Interactive Family Tree */}
        <TabsContent value="tree" className="space-y-4 pt-1 focus:outline-none">
          {isTreeLoading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500 mb-3" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'bn' ? 'ফ্যামিলি ট্রি প্রস্তুত হচ্ছে...' : 'Building family health tree...'}
              </p>
            </div>
          ) : treeData ? (
            <FamilyTree
              treeData={treeData}
              onSelectMember={(mId) => setSelectedMemberId(mId)}
              onAddMember={() => setAddModalOpen(true)}
            />
          ) : (
            <div className="p-8 text-center text-xs text-gray-400">
              {lang === 'bn' ? 'ফ্যামিলি ট্রি লোড করা সম্ভব হয়নি' : 'Failed to load family tree'}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Connected Members List */}
        <TabsContent value="members" className="space-y-3 pt-1 focus:outline-none">
          {isConnsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500 mb-2" />
              <p className="text-xs">{lang === 'bn' ? 'সদস্য তালিকা লোড হচ্ছে...' : 'Loading members...'}</p>
            </div>
          ) : acceptedMembers.length === 0 ? (
            <div className="p-12 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {lang === 'bn' ? 'এখনো কোনো সদস্য যুক্ত নেই' : 'No connected family members yet'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {lang === 'bn'
                  ? 'আপনার পিতা-মাতা বা স্বজনদের ইউজারনেম দিয়ে আমন্ত্রণ পাঠিয়ে এখানে তাঁদের স্বাস্থ্য তালিকা দেখতে পারবেন।'
                  : 'Search your parents or relatives by their username and send an invitation to monitor their health.'}
              </p>
              <Button
                size="sm"
                onClick={() => setAddModalOpen(true)}
                className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                <span>{lang === 'bn' ? 'সদস্য আমন্ত্রণ পাঠান' : 'Send Invite'}</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {acceptedMembers.map((c) => (
                <FamilyMemberCard
                  key={c.id}
                  connection={c}
                  onViewHealth={(mId) => setSelectedMemberId(mId)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Pending Invitations */}
        <TabsContent value="invitations" className="space-y-4 pt-1 focus:outline-none">
          {/* Received Requests */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
              {lang === 'bn' ? `প্রাপ্ত আমন্ত্রণসমূহ (${pendingReceived.length})` : `Received Invitations (${pendingReceived.length})`}
            </h4>
            {pendingReceived.length === 0 ? (
              <p className="text-xs text-gray-400 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-center">
                {lang === 'bn' ? 'কোনো নতুন আমন্ত্রণ নেই' : 'No received invitations waiting for approval'}
              </p>
            ) : (
              <div className="space-y-2">
                {pendingReceived.map((c) => (
                  <InvitationCard key={c.id} connection={c} />
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
              {lang === 'bn' ? `প্রেরিত আমন্ত্রণসমূহ (${pendingSent.length})` : `Sent Invitations (${pendingSent.length})`}
            </h4>
            {pendingSent.length === 0 ? (
              <p className="text-xs text-gray-400 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-center">
                {lang === 'bn' ? 'কোনো প্রেরিত আমন্ত্রণ অপেক্ষমান নেই' : 'No outgoing invitations pending'}
              </p>
            ) : (
              <div className="space-y-2">
                {pendingSent.map((c) => (
                  <InvitationCard key={c.id} connection={c} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Member Modal Dialog */}
      <AddFamilyMember open={addModalOpen} onOpenChange={setAddModalOpen} />

      {/* Slide-over Member Health Details */}
      <MemberHealthPanel
        memberId={selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
      />
    </div>
  )
}
