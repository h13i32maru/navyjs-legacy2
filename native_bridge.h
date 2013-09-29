#ifndef NATIVE_BRIDGE_H
#define NATIVE_BRIDGE_H

#include "util/n_json.h"

#include <QObject>
#include <QList>
#include <QMap>
#include <QVariant>
#include <QVariantMap>

class NativeBridge : public QObject
{
    Q_OBJECT
public:
    explicit NativeBridge(QObject *parent = 0);
    void setLayoutPath(const QString &layoutPath);

    Q_INVOKABLE QString getLayoutPath() const;
    Q_INVOKABLE void setViewsFromJS(const QString &viewsJsonText);
    Q_INVOKABLE void setCurrentViewFromJS(const QString &viewJsonText);
    Q_INVOKABLE void setCurrentViewPosFromJS(const int &x, const int &y);

private:
    QString mLayoutPath;

signals:
    void viewsFromJS(const QList< QMap<QString, QString> > &views);
    void currentViewFromJS(const NJson &json);
    void currentViewPosFromJS(const int &x, const int &y);
    void changedLayoutContent();

    void changedViewsOrderToJS(const QStringList &viewIds);
    void changedSelectedViewToJS(const QString &viewId);
    void changedViewPropertyToJS(const QVariant &json);
    void addViewToJS(const QString &viewId, const QString &viewClass);
    void deleteViewToJS(const QString &viewId);

public slots:

};

#endif // NATIVE_BRIDGE_H
