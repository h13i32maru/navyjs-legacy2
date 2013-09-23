#ifndef N_LAYOUT_EDIT_WIDGET_H
#define N_LAYOUT_EDIT_WIDGET_H

#include "native_bridge.h"

#include <QModelIndex>
#include <QTreeWidgetItem>
#include <QWebView>
#include <QWidget>

namespace Ui {
class NLayoutEditWidget;
}

class NLayoutEditWidget : public QWidget
{
    Q_OBJECT

public:
    enum ViewsCol {ViewsColId, ViewsColClass};
    enum ViewClassCol {ViewClassColName, ViewClassColClass};

    explicit NLayoutEditWidget(QWidget *parent = 0);
    void setNativeBridge(NativeBridge *native);
    void loadFile(QString filePath);
    ~NLayoutEditWidget();

private:
    Ui::NLayoutEditWidget *ui;
    NativeBridge *mNative;

private slots:
    void contextMenuForViewsTree(const QPoint &point);
    void injectNativeBridge();
    void setViewsFromJS(const QList< QMap<QString, QString> > &views);
    void updateViewsToJS();
    void selectViewToJS();
    void addViewToJS(QTreeWidgetItem *item, int index);
    void deleteViewToJS();
    void setCurrentViewFromJS(const NJson &json);
};

#endif // N_LAYOUT_EDIT_WIDGET_H
