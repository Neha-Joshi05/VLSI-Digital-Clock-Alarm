// ============================================
// alarm.v — Alarm comparator + snooze
// ============================================
module alarm (
    input  wire       clk, rst_n, tick_1hz,
    input  wire [4:0] cur_hr,
    input  wire [5:0] cur_min,
    input  wire [5:0] cur_sec,
    input  wire [4:0] alm_hr,
    input  wire [5:0] alm_min,
    input  wire       alm_en,
    input  wire       snooze_btn,
    input  wire       dismiss_btn,
    output reg        buzzer,
    output reg        alarm_led,
    output reg  [2:0] snooze_cnt
);
    localparam SNOOZE_MINS = 6'd5;
    localparam MAX_SNOOZE  = 3'd3;
    localparam BUZZ_SECS   = 6'd30;

    reg [5:0] buzz_timer;
    reg [5:0] snooze_min_target;
    reg       snoozed;

    wire time_match = alm_en &&
                      (cur_hr  == alm_hr) &&
                      (cur_min == (snoozed ? snooze_min_target : alm_min)) &&
                      (cur_sec == 6'd0);

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            buzzer           <= 0;
            alarm_led        <= 0;
            buzz_timer       <= 0;
            snooze_cnt       <= 0;
            snoozed          <= 0;
            snooze_min_target<= 0;
        end else begin
            // Trigger
            if (time_match && !buzzer) begin
                buzzer     <= 1;
                alarm_led  <= 1;
                buzz_timer <= BUZZ_SECS;
            end

            // Count down buzzer
            if (buzzer && tick_1hz) begin
                if (buzz_timer == 0) begin
                    buzzer    <= 0;
                    alarm_led <= 0;
                end else buzz_timer <= buzz_timer - 1;
            end

            // Snooze
            if (snooze_btn && buzzer && snooze_cnt < MAX_SNOOZE) begin
                buzzer             <= 0;
                snoozed            <= 1;
                snooze_cnt         <= snooze_cnt + 1;
                snooze_min_target  <=
                    (cur_min + SNOOZE_MINS > 6'd59)
                    ? (cur_min + SNOOZE_MINS - 6'd60)
                    : (cur_min + SNOOZE_MINS);
            end

            // Dismiss
            if (dismiss_btn) begin
                buzzer     <= 0;
                alarm_led  <= 0;
                snoozed    <= 0;
                snooze_cnt <= 0;
            end
        end
    end
endmodule