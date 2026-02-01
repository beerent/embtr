import { redirect } from 'next/navigation';

import { getUsers } from '@/server/users/actions';
import { Session } from '@/server/session/Session';
import { PageHeader } from '../_components/ui/PageHeader';
import { UsersView } from './_components/UsersView';

export default async function UsersPage() {
    const session = await Session.getSession();

    if (session.role !== 'admin') {
        redirect('/today');
    }

    const users = await getUsers();

    return (
        <div>
            <PageHeader>Users</PageHeader>
            <UsersView users={users} />
        </div>
    );
}
