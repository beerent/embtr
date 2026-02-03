import { getMyBucketsWithWater } from '@/server/buckets/actions';
import { getMyHabits } from '@/server/habits/actions';
import { PageHeader } from '../_components/ui/PageHeader';
import { BucketList } from './_components/BucketList';

export default async function BucketsPage() {
    const [bucketResult, habitResult] = await Promise.all([
        getMyBucketsWithWater(),
        getMyHabits(),
    ]);

    const buckets = bucketResult.buckets ?? [];
    const allocatedWater = bucketResult.allocatedWater ?? 0;
    const remainingWater = bucketResult.remainingWater ?? 100;
    const habits = habitResult.habits ?? [];

    return (
        <div>
            <PageHeader>Buckets</PageHeader>
            <BucketList
                buckets={buckets}
                habits={habits}
                allocatedWater={allocatedWater}
                remainingWater={remainingWater}
            />
        </div>
    );
}
