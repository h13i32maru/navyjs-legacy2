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
//    Q_INVOKABLE void setLayers(QList< QMap<QString, QString> > layers);
//    Q_INVOKABLE void setLayers(QList< QMap<QString, QVariant> > layers);
//    Q_INVOKABLE void setLayers(QList< QVariantMap > layers);
    Q_INVOKABLE void addLayer(const QVariantMap &layer, const int &totalCount);

private:
    QString mLayoutPath;
    QList< QMap<QString, QString> > mLayers;


signals:
    void changedLayers(const QList< QMap<QString, QString> > & layers);

public slots:

};

#endif // NATIVE_BRIDGE_H
