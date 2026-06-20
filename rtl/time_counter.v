// ============================================
// time_counter.v — HH:MM:SS BCD counter
// Supports 12/24hr mode, set time via buttons
// ============================================
module time_counter (
    input  wire       clk, rst_n, tick_1hz,
    input  wire       mode_12_24,   // 0=24hr 1=12hr
    input  wire       set_mode,     // 1=time-set mode
    input  wire       set_hr_pulse, // increment hour
    input  wire       set_min_pulse,// increment minute
    output reg  [4:0] hrs,          // 0-23
    output reg  [5:0] mins,         // 0-59
    output reg  [5:0] secs,         // 0-59
    output reg        pm_flag       // 1=PM (12hr mode)
);
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            hrs <= 0; mins <= 0; secs <= 0; pm_flag <= 0;
        end else begin
            // Manual set
            if (set_mode) begin
                if (set_hr_pulse) begin
                    if (hrs == 5'd23) hrs <= 0;
                    else hrs <= hrs + 1;
                end
                if (set_min_pulse) begin
                    secs <= 0;
                    if (mins == 6'd59) mins <= 0;
                    else mins <= mins + 1;
                end
            end else if (tick_1hz) begin
                // Normal tick
                if (secs == 6'd59) begin
                    secs <= 0;
                    if (mins == 6'd59) begin
                        mins <= 0;
                        if (hrs == 5'd23) hrs <= 0;
                        else hrs <= hrs + 1;
                    end else mins <= mins + 1;
                end else secs <= secs + 1;
            end

            // PM flag for 12hr mode
            if (mode_12_24)
                pm_flag <= (hrs >= 5'd12);
        end
    end
endmodule