<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MagicLinkMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $loginUrl;

    public function __construct(public User $user, string $token)
    {
        $this->loginUrl = url('/auth/magic-link/' . $token);
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your TDC Reporting login link');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.magic-link');
    }
}
