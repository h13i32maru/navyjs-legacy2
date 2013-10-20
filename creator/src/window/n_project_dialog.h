#ifndef N_PROJECT_DIALOG_H
#define N_PROJECT_DIALOG_H

#include <QDialog>
#include "util/n_json.h"

namespace Ui {
class NProjectDialog;
}

class NProjectDialog : public QDialog
{
    Q_OBJECT

public:
    explicit NProjectDialog(QWidget *parent = 0);
    void setProjectJson(NJson projectJson);
    NJson getProjectJson() const;
    ~NProjectDialog();

public slots:
    virtual void accept();

private:
    Ui::NProjectDialog *ui;
    NJson mProjectJson;

    void syncJsonToWidget();
    void syncWidgetToJson();
};

#endif // N_PROJECT_DIALOG_H
