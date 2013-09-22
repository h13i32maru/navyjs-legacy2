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
    enum LayerCol {LayerColId, LayerColClass, LayerColPos, LayerColSize};

    explicit NLayoutEditWidget(QWidget *parent = 0);
    void setNativeBridge(NativeBridge *native);
    void loadFile(QString filePath);
    ~NLayoutEditWidget();

private:
    Ui::NLayoutEditWidget *ui;
    NativeBridge *mNative;

private slots:
    void injectNativeBridge();
    void setLayers(const QList< QMap<QString, QString> > &layers);
    void changedLayersByDrop();
};

#endif // N_LAYOUT_EDIT_WIDGET_H
