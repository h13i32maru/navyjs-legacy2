#ifndef NATIVE_BRIDGE_H
#define NATIVE_BRIDGE_H

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
    Q_INVOKABLE void addLayer(const QVariantMap &layer, const int &totalCount);
    Q_INVOKABLE void setJsonOfView(const QVariant &json);

private:
    QString mLayoutPath;
    QList< QMap<QString, QString> > mLayers;


signals:
    void changedLayers(const QList< QMap<QString, QString> > & layers);
    void changedJsonOfView(const QVariant &json);

    void changedLayersToJS(const QStringList &layerIds);
    void changedSelectedViewToJS(const QString &viewId);
    void updatePropertyToJS(const QVariant &json);

public slots:

};

#endif // NATIVE_BRIDGE_H
