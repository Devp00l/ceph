import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'cd-health',
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.scss']
})
export class HealthComponent implements OnInit {
  health: any;
  check: any;

  constructor() {
    this.health = {};
    this.check = {};
  }

  ngOnInit() {}

  //     // Pre-populated initial data at page load
  //     var content_data = {{ content_data }};

  //     rivets.formatters.mon_summary = function(mon_status) {
  //         var result = mon_status.monmap.mons.length.toString() + " (quorum ";
  //         result += mon_status.quorum.join(", ");
  //         result += ")";

  //         return result;
  //     };

  //     rivets.formatters.mds_summary = function(fs_map) {
  //         var standbys = 0;
  //         var active = 0;
  //         var standby_replay = 0;
  //         $.each(fs_map.standbys, function(i, s) {
  //             standbys += 1;
  //         });

  //         if (fs_map.standbys && !fs_map.filesystems) {
  //             return standbys + ", no filesystems"
  //         } else if (fs_map.filesystems.length == 0) {
  //             return "no filesystems";
  //         } else {
  //             $.each(fs_map.filesystems, function(i, fs) {
  //                 $.each(fs.mdsmap.info, function(j, mds) {
  //                     if (mds.state == "up:standby-replay") {
  //                         standby_replay += 1;
  //                     } else {
  //                         active += 1;
  //                     }
  //                 });
  //             });

  //             return active + " active, " + (standbys + standby_replay) + " standby";
  //         }
  //     };

  //     rivets.formatters.mgr_summary = function(mgr_map) {
  //         var result = "";
  //         result += "active: " + mgr_map.active_name;
  //         if (mgr_map.standbys.length) {
  //             result += ", " + mgr_map.standbys.length + " standbys";
  //         }

  //         return result;
  //     };

  //     rivets.formatters.log_color = function(log_line) {
  //         if (log_line.priority == "[INF]") {
  //             return "";  // Inherit
  //         } else if (log_line.priority == "[WRN]") {
  //             return "color: #FFC200";
  //         } else if (log_line.priority == "[ERR]") {
  //             return "color: #FF2222";
  //         } else {
  //             return "";
  //         }
  //     };

  //     rivets.formatters.osd_summary = function(osd_map) {
  //         var in_count = 0;
  //         var up_count = 0;
  //         $.each(osd_map.osds, function(i, osd) {
  //             if (osd.in) {
  //                 in_count++;
  //             }
  //             if (osd.up) {
  //                 up_count++;
  //             }
  //         });

  //         return osd_map.osds.length + " (" + up_count + " up, " + in_count + " in)";
  //     };

  //     rivets.formatters.pg_status_style = function(pg_status) {
  //         var warning = false;
  //         var error = false;

  //         $.each(pg_status, function(state, count) {
  //             if (state.includes("inconsistent") ||
  //                 state.includes("incomplete") ||
  //                 !state.includes("active")
  //             ) {
  //                 error = true;
  //             }

  //             if (state != "active+clean"
  //              && state != "active+clean+scrubbing"
  //              && state != "active+clean+scrubbing+deep") {
  //                 warning = true;
  //             }
  //         });

  //         if (error) {
  //             return "color: #FF0000";
  //         }

  //         if (warning) {
  //             return "color: #FFC200";
  //         }

  //         return "color: #00BB00";
  //     };

  //     rivets.formatters.pg_status = function(pg_status) {
  //         var strings = [];
  //         $.each(pg_status, function(state, count) {
  //             strings.push(count + " " + state);
  //         });

  //         return strings.join(", ");
  //     };

  //     // An extension to Chart.js to enable rendering some
  //     // text in the middle of a doughnut
  //     Chart.pluginService.register({
  //       beforeDraw: function(chart) {
  //         if (!chart.options.center_text) {
  //             return;
  //         }
  //         var width = chart.chart.width,
  //             height = chart.chart.height,
  //             ctx = chart.chart.ctx;

  //         ctx.restore();
  //         var fontSize = (height / 114).toFixed(2);
  //         ctx.font = fontSize + "em sans-serif";
  //         ctx.fillStyle = "#ddd";
  //         ctx.textBaseline = "middle";


  //         var text = chart.options.center_text,
  //             textX = Math.round((width - ctx.measureText(text).width) / 2),
  //             textY = height / 2;

  //         ctx.fillText(text, textX, textY);
  //         ctx.save();
  //       }
  //     });

  //     var draw_usage_charts = function() {
  //         var raw_usage_text = Math.round(100*(
  //             content_data.df.stats.total_used_bytes
  //             / content_data.df.stats.total_bytes)) + "%";
  //         var raw_usage_canvas = $("#raw_usage_chart").get(0).getContext("2d");
  //         if (content_data.df.stats.total_used_bytes/content_data.df.stats.total_bytes
  //             >= content_data.osd_map.full_ratio) {
  //             var raw_usage_chart_color = "#ff0000";
  //         } else if (content_data.df.stats.total_used_bytes/content_data.df.stats.total_bytes
  //                    >= content_data.osd_map.backfillfull_ratio) {
  //             var raw_usage_chart_color = "#ff6600";
  //         } else if (content_data.df.stats.total_used_bytes/content_data.df.stats.total_bytes
  //                    >= content_data.osd_map.nearfull_ratio) {
  //             var raw_usage_chart_color = "#ffc200";
  //         } else {
  //             var raw_usage_chart_color = "#00bb00";
  //         }
  //         var raw_usage_chart = new Chart(raw_usage_canvas, {
  //             type: 'doughnut',
  //             data: {
  //                 labels:[
  //                     "Raw Used",
  //                     "Raw Available"
  //                 ],
  //                 datasets: [
  //                     {
  //                     'label': null,
  //                     borderWidth: 0,
  //                     data:[
  //                         content_data.df.stats.total_used_bytes,
  //                         content_data.df.stats.total_avail_bytes
  //                     ],
  //                     backgroundColor: [raw_usage_chart_color, "#424d52"]
  //                     }
  //                 ]
  //             },
  //             options: {
  //                 center_text: raw_usage_text,
  //                 responsive: true,
  //                 legend: {display: false},
  //                 animation: {duration: 0},
  //                 tooltips: {
  //                     callbacks: {
  //                         label: function(tooltipItem, chart) {
  //                             return chart.labels[tooltipItem.index] + ": " +
  //       rivets.formatters.dimless_binary(chart.datasets[0].data[tooltipItem.index]);
  //                         }
  //                     }
  //                 }
  //             }
  //         });

  //         var colors = ['#3366CC','#DC3912','#FF9900','#109618','#990099',
  //             '#3B3EAC','#0099C6','#DD4477','#66AA00','#B82E2E','#316395',
  //             '#994499','#22AA99','#AAAA11','#6633CC','#E67300','#8B0707',
  //             '#329262','#5574A6','#3B3EAC'];

  //         var pool_usage_canvas = $("#pool_usage_chart").get(0).getContext("2d");
  //         var pool_labels = [];
  //         var pool_data = [];

  //         $.each(content_data.df.pools, function(i, pool) {
  //             pool_labels.push(pool['name']);
  //             pool_data.push(pool['stats']['bytes_used']);
  //         });

  //         var pool_usage_chart = new Chart(pool_usage_canvas, {
  //             type: 'doughnut',
  //             data: {
  //                 labels:pool_labels,
  //                 datasets: [
  //                     {
  //                     'label': null,
  //                     borderWidth: 0,
  //                     data:pool_data,
  //                     backgroundColor: colors
  //                     }
  //                 ]
  //             },
  //             options: {
  //                 responsive: true,
  //                 legend: {display: false},
  //                 animation: {duration: 0},
  //                 tooltips: {
  //                     callbacks: {
  //                         label: function(tooltipItem, chart) {
  //                             return chart.labels[tooltipItem.index] + ": " +
  //       rivets.formatters.dimless_binary(chart.datasets[0].data[tooltipItem.index]);
  //                         }
  //                     }
  //                 }
  //             }
  //         });
  //     }

  //     draw_usage_charts();
  //     rivets.bind($("#content"), content_data);

  //     var refresh = function() {
  //         $.get("{{ url_prefix }}/health_data", function(data) {
  //             _.extend(content_data, data);
  //             draw_usage_charts();
  //             setTimeout(refresh, 5000);
  //         });
  //     };
  //     setTimeout(refresh, 5000);
  // });

}
