import { useState } from "react";
import Modal from "../common/Modal";
import { createDoctor } from "../../../api/ecgApi";
import { useNotification } from "../../../contexts/NotificationContext";

interface InviteDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InviteDoctorModal({ isOpen, onClose, onSuccess }: InviteDoctorModalProps) {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialization: "",
    licenseNumber: "",
    hospital: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createDoctor(formData);
      showNotification("Invitation email sent", "success");

      setIsSubmitting(false);
      onSuccess?.();
      onClose();

      setFormData({
        name: "",
        email: "",
        specialization: "",
        licenseNumber: "",
        hospital: "",
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to invite doctor");
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Doctor">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Doctor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Dr. John Doe"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="doctor@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Specialization <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Cardiology"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">License Number</label>
          <input
            type="text"
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="LIC-12345"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Hospital/Affiliation</label>
          <input
            type="text"
            name="hospital"
            value={formData.hospital}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="City Hospital"
          />
        </div>

        <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-4">
          <p className="text-sm text-sky-900">
            A secure invitation email will be sent with a temporary password and a one-time setup link.
          </p>
          <p className="mt-1 text-xs text-sky-700">
            Doctors complete onboarding by setting their own password. Temporary credentials are not surfaced in the admin UI.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send Invitation"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
