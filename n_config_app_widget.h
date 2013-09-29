#ifndef N_CONFIG_APP_WIDGET_H
#define N_CONFIG_APP_WIDGET_H

#include "n_file_widget.h"
#include "n_json.h"

#include <QWidget>
#include <QDir>

namespace Ui {
class NConfigAppWidget;
}

class NConfigAppWidget : public NFileWidget
{
    Q_OBJECT

public:
    explicit NConfigAppWidget(const QDir &projectDir, const QString &filePath, QWidget *parent = 0);
    virtual bool save();
    ~NConfigAppWidget();

private:
    Ui::NConfigAppWidget *ui;
    NJson mConfigApp;

    void syncWidgetToJson();
    void syncJsonToWidget();

private slots:
    void contextMenu(QPoint point);
    void showRawData();
};

#endif // N_CONFIG_APP_WIDGET_H
