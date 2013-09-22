#ifndef N_LAYOUT_EDIT_WIDGET_H
#define N_LAYOUT_EDIT_WIDGET_H

#include "native_bridge.h"

#include <QWebView>
#include <QWidget>

namespace Ui {
class NLayoutEditWidget;
}

class NLayoutEditWidget : public QWidget
{
    Q_OBJECT

public:
    enum ViewsCol {ViewsColId, ViewsColClass, ViewsColPos, ViewsColSize};

    explicit NLayoutEditWidget(QWidget *parent = 0);
    void setNativeBridge(NativeBridge *native);
    void loadFile(QString filePath);
    ~NLayoutEditWidget();

private:
    Ui::NLayoutEditWidget *ui;
    NativeBridge *mNative;

private slots:
    void injectNativeBridge();
    void setViewsFromJS(const QList< QMap<QString, QString> > &views);
    void updateViewsToJS();
    void selectViewToJS();
};

#endif // N_LAYOUT_EDIT_WIDGET_H
