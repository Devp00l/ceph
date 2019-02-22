export class PrometheusAlertLabels {
  alertname: string;
  instance: string;
  job: string;
  severity: string;
}

class Annotations {
  description: string;
  summary: string;
}

class CommonAlertmanagerAlert {
  labels: PrometheusAlertLabels;
  annotations: Annotations;
  startsAt: string; // Date string
  endsAt: string; // Date string
  generatorURL: string;
}

class PrometheusAlert {
  labels: PrometheusAlertLabels;
  annotations: Annotations;
  state: 'pending' | 'firing';
  activeAt: string; // Date string
  value: number;
}

export class PrometheusRule {
  name: string; // => PrometheusAlertLabels.alertname
  query: string;
  duration: 10;
  labels: {
    severity: string; // => PrometheusAlertLabels.severity
  };
  annotations: Annotations;
  alerts: PrometheusAlert[]; // Shows only active alerts
  health: string;
  type: string;
}

export class AlertmanagerAlert extends CommonAlertmanagerAlert {
  status: {
    state: 'unprocessed' | 'active' | 'suppressed';
    silencedBy: null | string[];
    inhibitedBy: null | string[];
  };
  receivers: string[];
  fingerprint: string;
}

export class AlertmanagerNotificationAlert extends CommonAlertmanagerAlert {
  status: 'firing' | 'resolved';
}

export class AlertmanagerNotification {
  status: 'firing' | 'resolved';
  groupLabels: object;
  commonAnnotations: object;
  groupKey: string;
  notified: string;
  alerts: AlertmanagerNotificationAlert[];
  version: string;
  receiver: string;
  externalURL: string;
  commonLabels: {
    severity: string;
  };
}

export class PrometheusCustomAlert {
  status: 'resolved' | 'unprocessed' | 'active' | 'suppressed';
  name: string;
  url: string;
  summary: string;
  fingerprint?: string | boolean;
}
