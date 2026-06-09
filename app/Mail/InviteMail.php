<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InviteMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $loginUrl;

    public function __construct(
        public User $user,
        string $token,
        public User $invitedBy,
    ) {
        $this->loginUrl = url('/auth/invite/' . $token);
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'You\'ve been invited to TDC Reporting');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.invite');
    }
}
