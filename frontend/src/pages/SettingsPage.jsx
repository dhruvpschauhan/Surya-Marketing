import DealerProfileForm from '../components/settings/DealerProfileForm';
import DealershipsDirectory from '../components/settings/DealershipsDirectory';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Settings</h2>
      <DealerProfileForm />
      <DealershipsDirectory />
    </div>
  );
}
