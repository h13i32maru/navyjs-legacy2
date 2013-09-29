#ifndef N_EXEC_WIDGET_H
#define N_EXEC_WIDGET_H

#include "native_bridge.h"

#include <QMainWindow>
#include <QUrl>
#include <QWebInspector>

namespace Ui {
class NExecWidget;
}

class NExecWidget : public QMainWindow
{
    Q_OBJECT

public:
    explicit NExecWidget(QWidget *parent = 0);
    void loadFile(const QString &filePath);
    ~NExecWidget();

private:
    Ui::NExecWidget *ui;
    QUrl mUrl;
    NativeBridge *mNative;
    QWebInspector *mInspector;

private slots:
    void contextMenuForWebView(const QPoint &point);
    void reload();
    void injectNativeBridge();

signals:
    void finishLoad();
};

#endif // N_EXEC_WIDGET_H
