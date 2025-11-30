import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateBooking } from "@/hooks/useCreateBooking";
import { Event } from "@/types/api";
import confetti from "canvas-confetti";

const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const BookingDialog = ({ event, open, onOpenChange, onSuccess }: BookingDialogProps) => {
  const [bookingStatus, setBookingStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const createBooking = useCreateBooking();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  const quantity = watch("quantity") || 1;
  const totalAmount = event ? event.price * quantity : 0;

  useEffect(() => {
    if (open) {
      reset({ quantity: 1 });
      setBookingStatus("idle");
      setErrorMessage("");
    }
  }, [open, reset]);

  const onSubmit = async (data: BookingFormData) => {
    if (!event) return;

    if (data.quantity > event.availableSeats) {
      setBookingStatus("error");
      setErrorMessage(`Only ${event.availableSeats} seats available. Please reduce quantity.`);
      return;
    }

    try {
      await createBooking.mutateAsync({
        eventId: event.id,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        quantity: data.quantity,
      });

      setBookingStatus("success");
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Close dialog and redirect after 100ms
      setTimeout(() => {
        onOpenChange(false);
        onSuccess();
      }, 100);
    } catch (error: any) {
      setBookingStatus("error");
      setErrorMessage(error?.message || "Booking failed. Please try again.");
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Book Tickets - {event.title}</DialogTitle>
        </DialogHeader>

        {bookingStatus === "success" && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-lg">
            <p className="text-green-600 dark:text-green-400 text-center font-medium">
              Booking Confirmed! Redirecting...
            </p>
          </div>
        )}

        {bookingStatus === "error" && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-destructive text-center">
              {errorMessage}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="John Doe"
              disabled={createBooking.isPending}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="john@example.com"
              disabled={createBooking.isPending}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              {...register("mobile")}
              placeholder="+1234567890"
              disabled={createBooking.isPending}
            />
            {errors.mobile && (
              <p className="text-sm text-destructive mt-1">{errors.mobile.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="quantity">Number of Tickets</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={event.availableSeats}
              {...register("quantity", { valueAsNumber: true })}
              disabled={createBooking.isPending}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Available: {event.availableSeats} seats
            </p>
            {errors.quantity && (
              <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="totalAmount">Total Amount</Label>
            <Input
              id="totalAmount"
              value={`$${totalAmount.toFixed(2)}`}
              disabled
              className="font-bold"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createBooking.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={createBooking.isPending || event.availableSeats === 0}
              className="flex-1"
            >
              {createBooking.isPending ? "Processing..." : "Confirm Booking"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
