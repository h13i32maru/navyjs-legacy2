#ifndef NATIVE_BRIDGE_H
#define NATIVE_BRIDGE_H

#include <QObject>

class NativeBridge : public QObject
{
    Q_OBJECT
public:
    explicit NativeBridge(QObject *parent = 0);
    void setLayoutPath(QString layoutPath);
    Q_INVOKABLE QString getLayoutPath();

private:
    QString mLayoutPath;

signals:

public slots:

};

#endif // NATIVE_BRIDGE_H
