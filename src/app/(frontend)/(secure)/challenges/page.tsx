import { getChallenges } from '@/server/challenges/actions';
import { PageHeader } from '../_components/ui/PageHeader';
import { ChallengesView } from './_components/ChallengesView';

export default async function ChallengesPage() {
    const result = await getChallenges();

    return (
        <div>
            <PageHeader>Challenges</PageHeader>
            <ChallengesView challenges={result.challenges ?? []} />
        </div>
    );
}
