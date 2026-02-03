import { getMyBucketsWithDrops } from '@/server/buckets/actions';
import { getMyHabits } from '@/server/habits/actions';
import { PageHeader } from '../_components/ui/PageHeader';
import { BucketList } from './_components/BucketList';

export default async function BucketsPage() {
    const [bucketResult, habitResult] = await Promise.all([
        getMyBucketsWithDrops(),
        getMyHabits(),
    ]);

    const buckets = bucketResult.buckets ?? [];
    const allocatedDrops = bucketResult.allocatedDrops ?? 0;
    const remainingDrops = bucketResult.remainingDrops ?? 100;
    const habits = habitResult.habits ?? [];

    return (
        <div>
            <PageHeader>Buckets</PageHeader>
            <BucketList
                buckets={buckets}
                habits={habits}
                allocatedDrops={allocatedDrops}
                remainingDrops={remainingDrops}
            />
        </div>
    );
}
