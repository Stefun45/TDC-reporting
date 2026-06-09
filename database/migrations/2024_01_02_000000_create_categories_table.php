<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('url')->nullable();
            $table->string('icon')->default('FileBarChart');
            $table->boolean('critical')->default(false);
            $table->boolean('active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        DB::table('categories')->insert([
            ['id' => 'finance',    'title' => 'Finance',                       'icon' => 'PoundSterling', 'description' => 'Revenue, cash, and financial health.',          'url' => 'https://evidence.thedespatchcompany.com', 'critical' => false, 'active' => true, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'onboarding', 'title' => 'Onboarding',                    'icon' => 'Rocket',        'description' => 'Activation and time-to-value.',                  'url' => '#', 'critical' => false, 'active' => true, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'sales',      'title' => 'Sales',                         'icon' => 'Target',        'description' => 'Pipeline, conversion, and rep performance.',     'url' => '#', 'critical' => false, 'active' => true, 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'marketing',  'title' => 'Marketing',                     'icon' => 'Megaphone',     'description' => 'Acquisition, funnel, and campaign ROI.',         'url' => '#', 'critical' => false, 'active' => true, 'sort_order' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'product',    'title' => 'Product / Engineering',         'icon' => 'Cpu',           'description' => 'Velocity, reliability, and adoption.',           'url' => '#', 'critical' => false, 'active' => true, 'sort_order' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'people',     'title' => 'People',                        'icon' => 'UserPlus',      'description' => 'Headcount, hiring, and retention.',              'url' => '#', 'critical' => false, 'active' => true, 'sort_order' => 6, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'mir',        'title' => 'MIR — Major Incident Response', 'icon' => 'Siren',         'description' => 'Live incidents, MTTR, and post-mortems.',        'url' => '#', 'critical' => true,  'active' => true, 'sort_order' => 7, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'security',   'title' => 'Security & Compliance',         'icon' => 'ShieldCheck',   'description' => 'Audits, access reviews, and SOC2 posture.',      'url' => '#', 'critical' => false, 'active' => true, 'sort_order' => 8, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
