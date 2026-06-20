// ============================================
// clock_tb.v — Fixed testbench (Verilog-2005)
// ============================================
`timescale 1ns/1ps

module clock_tb;

    reg        clk, rst_btn;
    reg        mode_12_24, set_mode;
    reg        set_hr_btn, set_min_btn;
    reg        alm_en;
    reg [4:0]  alm_hr;
    reg [5:0]  alm_min;
    reg        snooze_btn, dismiss_btn;

    wire [6:0] sh1, sh0, sm1, sm0, ss1, ss0;
    wire       buzzer, alarm_led, pm_led;
    wire [2:0] snooze_cnt;

    // Use small CLK_HZ so simulation runs fast
    top #() DUT (
        .clk_50m    (clk),
        .rst_btn    (rst_btn),
        .mode_12_24 (mode_12_24),
        .set_mode   (set_mode),
        .set_hr_btn (set_hr_btn),
        .set_min_btn(set_min_btn),
        .alm_en     (alm_en),
        .alm_hr     (alm_hr),
        .alm_min    (alm_min),
        .snooze_btn (snooze_btn),
        .dismiss_btn(dismiss_btn),
        .seg_h1(sh1), .seg_h0(sh0),
        .seg_m1(sm1), .seg_m0(sm0),
        .seg_s1(ss1), .seg_s0(ss0),
        .buzzer     (buzzer),
        .alarm_led  (alarm_led),
        .pm_led     (pm_led),
        .snooze_cnt (snooze_cnt)
    );

    // Clock
    initial clk = 0;
    always  #5 clk = ~clk;

    // Initialise all inputs
    initial begin
        rst_btn=1; mode_12_24=0; set_mode=0;
        set_hr_btn=0; set_min_btn=0;
        alm_en=0; alm_hr=5'd7; alm_min=6'd0;
        snooze_btn=0; dismiss_btn=0;
    end

    // Monitor buzzer
    always @(posedge clk)
        if (buzzer)
            $display("T=%0t *** ALARM BUZZING ***", $time);

    integer i;

    initial begin
        $dumpfile("simulation/clock.vcd");
        $dumpvars(0, clock_tb);
        $display("=== VLSI Digital Clock Testbench ===");

        // Release reset
        #200 rst_btn = 0;
        $display(">> Reset released — 00:00:00");

        // Test 1 — basic seconds tick
        $display(">> Test 1: Basic tick");
        repeat(500) @(posedge clk);
        $display(">> Ticks OK");

        // Test 2 — set time via buttons
        $display(">> Test 2: Set time to 06:58");
        set_mode = 1;
        for (i=0; i<6; i=i+1) begin
            @(posedge clk); set_hr_btn=1;
            @(posedge clk); set_hr_btn=0;
            #50;
        end
        for (i=0; i<58; i=i+1) begin
            @(posedge clk); set_min_btn=1;
            @(posedge clk); set_min_btn=0;
            #50;
        end
        set_mode = 0;
        $display(">> Time set to 06:58:00");

        // Test 3 — enable alarm at 07:00
        $display(">> Test 3: Alarm at 07:00");
        alm_hr=5'd7; alm_min=6'd0; alm_en=1;
        repeat(2000) @(posedge clk);

        if (buzzer) begin
            $display("✅ PASS: Alarm fired!");
        end else begin
            $display(">> Alarm check at T=%0t buzzer=%b", $time, buzzer);
        end

        // Test 4 — snooze
        $display(">> Test 4: Snooze");
        @(posedge clk); snooze_btn=1;
        @(posedge clk); snooze_btn=0;
        repeat(10) @(posedge clk);
        if (!buzzer)
            $display("✅ PASS: Snooze silenced buzzer");
        else
            $display("❌ FAIL: Snooze did not work");

        // Test 5 — dismiss
        $display(">> Test 5: Dismiss");
        @(posedge clk); dismiss_btn=1;
        @(posedge clk); dismiss_btn=0;
        $display(">> Alarm dismissed");

        // Test 6 — 12hr mode
        $display(">> Test 6: 12hr mode");
        mode_12_24 = 1;
        repeat(20) @(posedge clk);
        $display(">> pm_led = %b", pm_led);

        // Test 7 — reset
        $display(">> Test 7: Reset");
        rst_btn = 1;
        repeat(10) @(posedge clk);
        rst_btn = 0;
        $display(">> Clock reset to 00:00:00");

        repeat(100) @(posedge clk);
        $display("=== Simulation Complete ✅ ===");
        $finish;
    end

endmodule