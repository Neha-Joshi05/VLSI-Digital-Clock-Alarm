// ============================================
// top.v — Digital Clock Top Module
// Wires: clk_en → time_counter → alarm → seg7
// ============================================
module top (
    input  wire        clk_50m,
    input  wire        rst_btn,
    input  wire        mode_12_24,
    input  wire        set_mode,
    input  wire        set_hr_btn,
    input  wire        set_min_btn,
    input  wire        alm_en,
    input  wire [4:0]  alm_hr,
    input  wire [5:0]  alm_min,
    input  wire        snooze_btn,
    input  wire        dismiss_btn,
    output wire [6:0]  seg_h1, seg_h0,
    output wire [6:0]  seg_m1, seg_m0,
    output wire [6:0]  seg_s1, seg_s0,
    output wire        buzzer,
    output wire        alarm_led,
    output wire        pm_led,
    output wire [2:0]  snooze_cnt
);
    wire rst_n = ~rst_btn;

    // 1Hz tick
    wire tick_1hz;
    clk_en #(.CLK_HZ(50_000_000), .TICK_HZ(1)) u_1hz (
        .clk(clk_50m), .rst_n(rst_n), .tick(tick_1hz));

    // Time counter
    wire [4:0] hrs;
    wire [5:0] mins, secs;
    wire       pm_flag;

    time_counter u_time (
        .clk(clk_50m), .rst_n(rst_n), .tick_1hz(tick_1hz),
        .mode_12_24(mode_12_24), .set_mode(set_mode),
        .set_hr_pulse(set_hr_btn), .set_min_pulse(set_min_btn),
        .hrs(hrs), .mins(mins), .secs(secs), .pm_flag(pm_flag)
    );

    // Alarm
    alarm u_alarm (
        .clk(clk_50m), .rst_n(rst_n), .tick_1hz(tick_1hz),
        .cur_hr(hrs), .cur_min(mins), .cur_sec(secs),
        .alm_hr(alm_hr), .alm_min(alm_min), .alm_en(alm_en),
        .snooze_btn(snooze_btn), .dismiss_btn(dismiss_btn),
        .buzzer(buzzer), .alarm_led(alarm_led),
        .snooze_cnt(snooze_cnt)
    );

    // Hours tens/units
    wire [3:0] h_tens = (hrs >= 20) ? 4'd2 : (hrs >= 10) ? 4'd1 : 4'd0;
    wire [3:0] h_unit = hrs - (h_tens * 5'd10);
    wire [3:0] m_tens = (mins >= 50) ? 4'd5 : (mins >= 40) ? 4'd4 :
                        (mins >= 30) ? 4'd3 : (mins >= 20) ? 4'd2 :
                        (mins >= 10) ? 4'd1 : 4'd0;
    wire [3:0] m_unit = mins - (m_tens * 6'd10);
    wire [3:0] s_tens = (secs >= 50) ? 4'd5 : (secs >= 40) ? 4'd4 :
                        (secs >= 30) ? 4'd3 : (secs >= 20) ? 4'd2 :
                        (secs >= 10) ? 4'd1 : 4'd0;
    wire [3:0] s_unit = secs - (s_tens * 6'd10);

    seg7 s_h1(.bcd(h_tens), .seg(seg_h1));
    seg7 s_h0(.bcd(h_unit), .seg(seg_h0));
    seg7 s_m1(.bcd(m_tens), .seg(seg_m1));
    seg7 s_m0(.bcd(m_unit), .seg(seg_m0));
    seg7 s_s1(.bcd(s_tens), .seg(seg_s1));
    seg7 s_s0(.bcd(s_unit), .seg(seg_s0));

endmodule