import { Session } from '@/server/session/Session';
import { getBugReports } from '@/server/bugs/actions';
import { PageHeader } from '../_components/ui/PageHeader';
import { BugsView } from './_components/BugsView';

export default async function BugsPage() {
    const session = await Session.getSession();
    const result = await getBugReports();

    return (
        <div>
            <PageHeader>Bug Reports</PageHeader>
            <BugsView
                bugReports={result.bugReports ?? []}
                isAdmin={session.role === 'admin'}
            />
        </div>
    );
}
