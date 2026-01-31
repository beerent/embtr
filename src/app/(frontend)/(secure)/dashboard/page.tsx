import { PageCard } from '../_components/ui/PageCard';
import { PageHeader } from '../_components/ui/PageHeader';

export default function DashboardPage() {
    return (
        <div>
            <PageHeader>Dashboard</PageHeader>
            <PageCard>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Welcome to embtr. Your habit tracking dashboard will appear here.
                </p>
            </PageCard>
        </div>
    );
}
