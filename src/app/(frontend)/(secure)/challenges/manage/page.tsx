import { redirect } from 'next/navigation';

import { getAllChallenges } from '@/server/challenges/actions';
import { Session } from '@/server/session/Session';
import { PageHeader } from '../../_components/ui/PageHeader';
import { ChallengeManageView } from './_components/ChallengeManageView';

export default async function ChallengeManagePage() {
    const session = await Session.getSession();

    if (session.role !== 'admin') {
        redirect('/today');
    }

    const result = await getAllChallenges();

    return (
        <div>
            <PageHeader>Manage Challenges</PageHeader>
            <ChallengeManageView challenges={result.challenges ?? []} />
        </div>
    );
}
